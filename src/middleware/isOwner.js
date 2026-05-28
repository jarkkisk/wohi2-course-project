const prisma = require("../lib/prisma");
const { NotFoundError, ForbiddenError } = require("../lib/errors");


const isOwner = async (req, res, next) => {
    const id = Number(req.params.qId);
    const quiz = await prisma.quiz.findUnique({
        where: { id }
    });

    if (!quiz) {
        throw new NotFoundError("User not found");
    }

    if (quiz.userId !== req.user.userId) {
        throw new ForbiddenError("You can only modify your own quizs");
    }

    req.resource = quiz;
    next();
};

module.exports = isOwner;
