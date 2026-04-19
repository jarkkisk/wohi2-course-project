const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const seedQuestions = [
    {
        question: "What color is the sun?",
        answer: "Yellow"
    },
    {
        question: "What color is the sea?",
        answer: "Blue"
    },
    {
        question: "What color is the grass?",
        answer: "Green"
    }
];

async function main() {
    await prisma.quiz.deleteMany();

    for (const post of seedQuestions) {
        await prisma.quiz.create({
            data: {
                question: post.question,
                answer: post.answer
            }
        });
    }
    console.log("Seed data inserted successfully");
}
main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());