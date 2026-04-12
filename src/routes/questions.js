const express = require("express");
const router = express.Router();

const questions = require("../data/questions");

// GET /questions
// List all questions
router.get("/", (req, res) => {
    res.json(questions);
});

// GET /questions/:qId
// Show a specific question
router.get("/:qId", (req, res) => {
    const qId = Number(req.params.qId);
    const qn = questions.find((q) => q.id === qId);

    if (!qn) {
        return res.status(404).json({ message: "Question not found" });
    }

    res.json(qn);
});

// POST /questions
// Create a new question
router.post("/", (req, res) => {
    //const { title, date, content, keywords } = req.body;
    const { question, answer } = req.body;

    if (!question || !answer) {
        return res.status(400).json({
            message: "question and answer are required"
        });
    }

    const maxId = Math.max(...questions.map(q => q.id), 0);
    const newQuestion = {
        id: questions.length ? maxId + 1 : 1,
        question, answer
        //keywords: Array.isArray(keywords) ? keywords : []
    };
    questions.push(newQuestion);

    res.status(201).json(newQuestion);
});

// PUT /questions/:qId
// Edit a question
router.put("/:qId", (req, res) => {
    const qId = Number(req.params.qId);
    const { question, answer } = req.body;
    const qn = questions.find((q) => q.id === qId);

    if (!qn) {
        return res.status(404).json({ message: "Question not found" });
    }
    if (!question || !answer) {
        return res.json({
            message: "question and answer are required"
        });
    }

    qn.question = question;
    qn.answer = answer;
    //qn.keywords = Array.isArray(keywords) ? keywords : [];

    res.json(qn);
});

// DELETE /questions/:qId
// Delete a question
router.delete("/:qId", (req, res) => {
    const qId = Number(req.params.qId);
    const questionIndex = questions.findIndex((q) => q.id === qId);
    if (questionIndex === -1) {
        return res.status(404).json({ message: "Question not found" });
    }
    const deletedQuestion = questions.splice(questionIndex, 1);
    res.json({
        message: "Question deleted successfully",
        post: deletedQuestion[0]
    });
});

module.exports = router;