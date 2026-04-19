const express = require("express");
const router = express.Router();
const prisma = require("../lib/prisma");
//const questions = require("../data/questions");

// GET /questions
// List all questions
router.get("/", async (req, res) => {
    const questions = await prisma.quiz.findMany()
    res.json(questions);
});

// GET /questions/:qId
// Show a specific question
router.get("/:qId", async (req, res) => {
    const qId = Number(req.params.qId);
    //const qn = questions.find((q) => q.id === qId);
    const qn = await prisma.quiz.findUnique({
        where: { id: qId }
    });

    if (!qn) {
        return res.status(404).json({
            message: "Question not found"
        });
    }

    res.json(qn);
});

// POST /questions
// Create a new question
router.post("/", async (req, res) => {
    //const { title, date, content, keywords } = req.body;
    const { question, answer } = req.body;

    if (!question || !answer) {
        return res.status(400).json({
            message: "question and answer are required"
        });
    }

    const newQuiz = await prisma.quiz.create({
        data: {
            question, answer
        }
    });

    res.status(201).json(newQuiz);
});

// PUT /questions/:qId
// Edit a question
router.put("/:qId", async (req, res) => {
    const qId = Number(req.params.qId);
    const { question, answer } = req.body;
    const qn = await prisma.quiz.findUnique({ where: { id: qId } });

    if (!qn) {
        return res.status(404).json({ message: "Question not found" });
    }
    if (!question || !answer) {
        return res.json({
            message: "question and answer are required"
        });
    }

    const updatedQuiz = await prisma.quiz.update({
        where: { id: qId },
        data: {
            question, answer
        }
    });

    res.json(updatedQuiz);
});

// DELETE /questions/:qId
// Delete a question
router.delete("/:qId", async (req, res) => {
    const qId = Number(req.params.qId);

    const q = await prisma.quiz.findUnique({
        where: { id: qId }
    });
    if (!q) {
        return res.status(404).json({ message: "Question not found" });
    }

    await prisma.quiz.delete({ where: { id: qId } });

    res.json({
        message: "Question deleted successfully",
        post: q
    });
});

module.exports = router;