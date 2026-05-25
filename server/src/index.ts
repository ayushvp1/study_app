import { Hono } from "hono";
import { cors } from "hono/cors";
import { jwt } from "hono/jwt";
import auth from "./routes/auth";
import admin from "./routes/admin";
import stats from "./routes/stats";
import messenger from "./routes/messages";
import speech from "./routes/speech";
import { db } from "./db";
import { attempts, recitations } from "./db/schema";
import { nanoid } from "nanoid";

const JWT_SECRET = "super-secret-key";
const SPECIAL_RECITATION_KEYS = new Set([101, 111, 121, 131, 141, 201, 211, 221]);

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
import { ensureMultiplicationModule } from "./db/seed-multiplications";

// Seed the multiplication module if missing
await ensureMultiplicationModule();

const app = new Hono();

app.use(cors());

// API Routes
app.route("/api/auth", auth);
app.route("/api/admin", admin);
app.route("/api/stats", stats);
app.route("/api/messages", messenger);
app.route("/api/speech", speech);

import { eq, and } from "drizzle-orm";

app.get("/api/questions", jwt({ secret: JWT_SECRET, alg: "HS256" }), async (c) => {
  const payload = c.get("jwtPayload") as any;
  const userId = payload.id;

  const allModules = await db.query.modules.findMany({
    with: {
      questions: true,
    },
    orderBy: (modules, { desc }) => [desc(modules.createdAt)],
  });

  const userAttempts = await db.query.attempts.findMany({
    where: eq(attempts.userId, userId),
  });

  const userRecitations = await db.query.recitations.findMany({
    where: eq(recitations.userId, userId),
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
    attempts: userAttempts.map((a) => ({
      questionId: a.questionId,
      answer: a.answer,
      isCorrect: a.isCorrect,
    })),
    recitations: userRecitations.map((r) => ({
      tableNumber: r.tableNumber,
      count: r.count,
    })),
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

app.post("/api/recitations/complete", jwt({ secret: JWT_SECRET, alg: "HS256" }), async (c) => {
  try {
    const payload = c.get("jwtPayload") as any;
    const userId = payload.id;
    const { tableNumber } = await c.req.json();

    const isStandardTable = typeof tableNumber === "number" && tableNumber >= 1 && tableNumber <= 30;
    const isSpecialPracticeRange = typeof tableNumber === "number" && SPECIAL_RECITATION_KEYS.has(tableNumber);

    if (!isStandardTable && !isSpecialPracticeRange) {
      return c.json({ error: "Invalid table number" }, 400);
    }

    const existing = await db.query.recitations.findFirst({
      where: and(
        eq(recitations.userId, userId),
        eq(recitations.tableNumber, tableNumber)
      ),
    });

    if (existing) {
      const updatedCount = existing.count + 1;
      await db.update(recitations)
        .set({
          count: updatedCount,
          updatedAt: new Date().toISOString()
        })
        .where(eq(recitations.id, existing.id));

      return c.json({ success: true, count: updatedCount });
    } else {
      const id = nanoid();
      await db.insert(recitations).values({
        id,
        userId,
        tableNumber,
        count: 1,
        updatedAt: new Date().toISOString()
      });

      return c.json({ success: true, count: 1 });
    }
  } catch (error: any) {
    console.error("Recitation completion failed:", error);
    return c.json({ error: error.message || "Failed to record recitation completion" }, 500);
  }
});

// Serve static files from the client build
app.use("/*", serveStatic({ root: "../client/dist" }));
app.get("*", serveStatic({ path: "../client/dist/index.html" }));

const port = Number(process.env.PORT) || 3000;

export type AppType = typeof app;

// Use Bun.serve for explicit 0.0.0.0 listening
export default {
  port,
  hostname: "0.0.0.0",
  fetch: app.fetch,
} as {
  port: number;
  hostname: string;
  fetch: typeof app.fetch;
} & typeof app;
