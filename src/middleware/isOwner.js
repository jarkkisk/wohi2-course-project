const prisma = require("../lib/prisma");

const isOwner = async (req, res, next) => {
    //console.log(req);
    const id = Number(req.params.qId);
    const quiz = await prisma.quiz.findUnique({
        where: { id }
    });


    if (!quiz) {
        throw new NotFoundError("Post not found");
        return res.status(404).json({ message: "User not found" });
    }

    if (quiz.userId !== req.user.userId) {
        throw new ForbiddenError("You can only modify your own posts");
        return res.status(403).json({ error: "You can only modify your own quizs" });
    }

    req.resource = quiz;
    next();
};

module.exports = isOwner;
