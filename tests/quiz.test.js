const { resetDb, registerAndLogin, request, app, prisma } = require("./helpers");

beforeEach(resetDb);

describe("questions tests", () => {
    it("returns 401 without a token", async () => {
        const res = await request(app).get("/api/questions");
        console.log(res.error.text)
        expect(res.status).toBe(401);
    });

    it("returns 404 for unknown question", async () => {
        const token = await registerAndLogin();
        const res = await request(app).get("/api/questions/99999")
            .set("Authorization", `Bearer ${token}`);
        expect(res.status).toBe(404);
        expect(res.body.message).toBe("Question not found");
    });

    it("returns 400 for invalid question body", async () => {
        const token = await registerAndLogin();
        const res = await request(app).post("/api/questions")
            .set("Authorization", `Bearer ${token}`)
            .send({ question: "" });
        expect(res.status).toBe(400);
    });

    it("returns 201 for valid question creation", async () => {
        const token = await registerAndLogin();
        const res = await request(app).post("/api/questions")
            .set("Authorization", `Bearer ${token}`)
            .send({ question: "Who is Bob?", answer: "Me" });
        expect(res.status).toBe(201);
        expect(res.body.question).toBe("Who is Bob?");
        expect(res.body.answer).toBe("Me");
    });

    it("returns 403 for unauthorized question editing", async () => {
        const token = await registerAndLogin();
        const res = await request(app).post("/api/questions")
            .set("Authorization", `Bearer ${token}`)
            .send({ question: "Who is this?", answer: "Bob" });

        const token2 = await registerAndLogin("admin@example.com", "Admin User");
        const res2 = await request(app).put(`/api/questions/${res.body.id}`)
            .set("Authorization", `Bearer ${token2}`)
            .send({ question: "Who is this?", answer: "EDITED" });

        expect(res2.status).toBe(403);
        expect(res2.body.message).toBe("You can only modify your own quizs");
    });
});