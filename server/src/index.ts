import { Hono } from "hono";
import { cors } from "hono/cors";
import { jwt } from "hono/jwt";
import auth from "./routes/auth";
import admin from "./routes/admin";
import stats from "./routes/stats";
import { db } from "./db";
import { attempts } from "./db/schema";
import { nanoid } from "nanoid";

const JWT_SECRET = "super-secret-key";

function parseQuestionOptions(options: string | null): string[] {
  if (!options) return [];

  try {
    const parsed = JSON.parse(options);
    return Array.isArray(parsed) ? parsed.map((option) => String(option)) : [];
  } catch {
    return [];
  }
}

import { serveStatic } from "hono/bun";

const app = new Hono();

app.use(cors());

// API Routes
app.route("/api/auth", auth);
app.route("/api/admin", admin);
app.route("/api/stats", stats);

app.get("/api/questions", jwt({ secret: JWT_SECRET, alg: "HS256" }), async (c) => {
  const allModules = await db.query.modules.findMany({
    with: {
      questions: true,
    },
    orderBy: (modules, { desc }) => [desc(modules.createdAt)],
  });

  const topics = allModules.map((mod) => ({
    id: mod.id,
    topic: mod.title,
    content: mod.content,
    totalQuestions: mod.questions.length,
    latestCreatedAt: mod.createdAt,
    questions: mod.questions.map((q) => ({
      id: q.id,
      type: q.type,
      text: q.text,
      options: parseQuestionOptions(q.options),
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      status: q.status,
      createdAt: q.createdAt,
    })),
  }));

  return c.json({
    topics,
  });
});

app.post("/api/questions/attempt", jwt({ secret: JWT_SECRET, alg: "HS256" }), async (c) => {
  try {
    const payload = c.get("jwtPayload") as any;
    const userId = payload.id;
    const { questionId, answer, isCorrect } = await c.req.json();

    if (!questionId || answer === undefined) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    await db.insert(attempts).values({
      id: nanoid(),
      userId,
      questionId,
      answer: String(answer),
      isCorrect: Boolean(isCorrect),
      attemptedAt: new Date().toISOString(),
    });

    return c.json({ success: true });
  } catch (error: any) {
    console.error("Attempt recording failed:", error);
    return c.json({ error: error.message || "Failed to record attempt" }, 500);
  }
});

// Serve static files from the client build
app.use("/*", serveStatic({ root: "../client/dist" }));
app.get("*", serveStatic({ path: "../client/dist/index.html" }));

export type AppType = typeof app;
export default app;
