// Builds and exports the Express app

const path = require("path");
const express = require("express");
const pinoHttp = require("pino-http");
const logger = require("./lib/logger");
const postsRouter = require("./routes/questions");
const authRouter = require("./routes/auth");
const errorHandler = require("./middleware/errorHandler");
const app = express();

// static files are served first
app.use(pinoHttp({ logger, autoLogging: { ignore: (r) => r.url.startsWith("/uploads") } }));

// Middleware to parse JSON bodies
app.use(express.json());

app.use(express.static(path.join(__dirname, "..", "public")));

// Routes
app.use("/api/auth", authRouter);
app.use("/api/posts", postsRouter);

app.use((req, res) => res.status(404).json({ message: "Not found" }));
app.use(errorHandler);

module.exports = app;