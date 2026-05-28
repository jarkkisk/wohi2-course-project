const express = require("express");
const router = express.Router();
const prisma = require("../lib/prisma");
const multer = require("multer");
const authenticate = require("../middleware/auth");
const isOwner = require("../middleware/isOwner");
const path = require('path');
const { NotFoundError, ValidationError } = require("../lib/errors");
const { z } = require("zod");

// Apply authentication to ALL routes in this router
router.use(authenticate);

const storage = multer.diskStorage({
    destination: path.join(__dirname, "..", "..", "public", "uploads"),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
    },
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) cb(null, true);
        else cb(new Error("Only image files are allowed"));
    },
    limits: { fileSize: 5 * 1024 * 1024 },
});

function formatQ(q) {
    return {
        ...q,
        keywords: q.keywords.map((k) => k.name),
        userName: q.user?.name || null,
        user: undefined,    // expose username only
        _count: undefined,
        solved: q.attempts?.length > 0,
        attemptCount: q._count?.attempts ?? 0
    };
}

function parseKeywords(keywords) {
    if (Array.isArray(keywords)) return keywords;
    if (typeof keywords === "string") {
        return keywords.split(",").map((k) =>
            k.trim()).filter(Boolean);
    }
    return [];
}


const PostInput = z.object({
    question: z.string().min(1),
    answer: z.string().min(1),
    keywords: z.union([z.string(), z.array(z.string())]).optional(),
});


// GET      /api/questions, /api/questions?keyword=http&page=1&limit=5
router.get("/", async (req, res) => {
    const { keyword } = req.query;

    const where = keyword ?
        { keywords: { some: { name: keyword } } } : {};

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 5));
    const skip = (page - 1) * limit;

    const [filteredQuestions, total] = await Promise.all([
        prisma.quiz.findMany({
            where,
            include: {
                keywords: true,
                user: true,
                attempts: {
                    where: { userId: req.user.userId },
                },
            },
            orderBy: { id: "asc" },
            skip,
            take: limit
        }),
        prisma.quiz.count({ where })
    ]);

    res.json({
        data: filteredQuestions.map(formatQ),
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
    });
});

// GET      /api/questions/random
// This must be before /:qId because Express matches routes in order
router.get("/random", async (req, res) => {
    const amount = 10;

    const quizs = await prisma.quiz.findMany({
        select: {
            id: true
        },
    });

    if (quizs.length < amount) {
        throw new NotFoundError(`At least ${amount} questions in database required`);
    }

    const shuffled = quizs.sort(
        () => Math.random() - 0.5
    ); // negative value -> swap order

    const randomIds = shuffled
        .slice(0, amount) // take the first 10
        .map(q => q.id);

    const qn = await prisma.quiz.findMany({
        where: {
            id: {
                in: randomIds,
            },
        },
        include: {
            keywords: true,
            user: true
        }
    });

    // qn is an array
    res.json(qn.map(formatQ));
});

// GET      /api/questions/:qId
router.get("/:qId", async (req, res) => {
    const qId = Number(req.params.qId);

    const qn = await prisma.quiz.findUnique({
        where: { id: qId },
        include: {
            keywords: true,
            user: true,
            attempts: {
                where: {
                    userId: req.user.userId,
                    correct: true
                },
                take: 1,
            }
        }
    });

    if (!qn) {
        throw new NotFoundError("Question not found");
    }

    res.json(formatQ(qn));
});


// POST     /api/questions
router.post("/", upload.single("image"), async (req, res) => {
    const { question, answer, keywords } = PostInput.parse(req.body); // throws ZodError on failure

    const keywordsArray = parseKeywords(keywords);
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const newQuiz = await prisma.quiz.create({
        data: {
            question,
            answer,
            imageUrl,
            userId: req.user.userId,
            keywords: {
                connectOrCreate: keywordsArray.map((kw) => ({
                    where: { name: kw },
                    create: { name: kw },
                })),
            },
        },
        include: {
            keywords: true,
            user: true,
            attempts: {
                where: {
                    userId: req.user.userId,
                    correct: true,
                },
                take: 1,
            },
            _count: { select: { attempts: true } },
        }
    });

    res.status(201).json(
        formatQ(newQuiz)
    );
});


// PUT      /api/questions/:qId
router.put("/:qId", isOwner, upload.single("image"), async (req, res) => {
    const qId = Number(req.params.qId);
    const { question, answer, keywords } = PostInput.parse(req.body);

    const qn = await prisma.quiz.findUnique({ where: { id: qId } });
    if (!qn) {
        throw new NotFoundError("Question not found");
    }
    if (!question || !answer) {
        throw new ValidationError("Question and answer are required");
    }

    const keywordsArray = parseKeywords(keywords);
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const updatedQuiz = await prisma.quiz.update({
        where: { id: qId },
        data: {
            question, answer,
            imageUrl,
            keywords: {
                set: [],
                connectOrCreate: keywordsArray.map((kw) => ({
                    where: { name: kw },
                    create: { name: kw },
                })),
            }
        },
        include: { keywords: true, user: true },
    });

    res.json({
        message: "Question updated successfully",
        q: formatQ(updatedQuiz)
    });
});


// DELETE       /api/questions/:qId
router.delete("/:qId", isOwner, async (req, res) => {
    const qId = Number(req.params.qId);

    const q = await prisma.quiz.findUnique({
        where: { id: qId },
        include: { keywords: true, user: true }
    });
    if (!q) {
    }

    // Delete attempts first
    await prisma.attempt.deleteMany({
        where: { quizId: qId }
    });

    await prisma.quiz.delete({ where: { id: qId } });

    res.json({
        message: "Question deleted successfully",
        q: formatQ(q)
    });
});


// POST       /api/questions/:qId/play
router.post("/:qId/play", async (req, res) => {
    const qId = Number(req.params.qId);

    const { answer } = req.body;

    console.log(req.user);

    if (!answer) {
        throw new ValidationError("Answer is required");
    }

    const question = await prisma.quiz.findUnique({
        where: { id: qId },
    });

    if (!question) {
        throw new NotFoundError("Question not found");
    }

    const correct =
        answer.trim().toLowerCase() === question.answer.trim().toLowerCase();

    const attempt = await prisma.attempt.create({
        data: {
            submittedAnswer: answer,
            correct,
            userId: req.user.userId,
            quizId: qId,
        },
    });

    res.status(201).json({
        id: attempt.id,
        correct,
        submittedAnswer: attempt.submittedAnswer,
        correctAnswer: question.answer,
        createdAt: attempt.createdAt,
    });
});


// Error handling
router.use((err, req, res, next) => {
    if (
        err instanceof multer.MulterError ||
        err?.message === "Only image files are allowed"
    ) {
        return res.status(400).json({ message: err.message });
    }

    next(err);
});


module.exports = router;