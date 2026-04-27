const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
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
    await prisma.user.deleteMany();
    await prisma.quiz.deleteMany();

    // Create a default user
    const hashedPassword = await bcrypt.hash("1234", 10);
    const user = await prisma.user.create({
        data: {
            email: "admin@example.com",
            password: hashedPassword,
            name: "Admin User",
        }
    });
    console.log("Created user:", user.email);

    for (const q of seedQuestions) {
        await prisma.quiz.create({
            data: {
                question: q.question,
                answer: q.answer,
                userId: user.id
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