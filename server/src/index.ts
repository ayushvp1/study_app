import { Hono } from "hono";
import { cors } from "hono/cors";
import { jwt } from "hono/jwt";
import auth from "./routes/auth";
import admin from "./routes/admin";
import stats from "./routes/stats";
import { db } from "./db";

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

const app = new Hono()
  .use(cors())
  .basePath("/api")
  .route("/auth", auth)
  .route("/admin", admin)
  .route("/stats", stats)
  .use("/questions", jwt({ secret: JWT_SECRET }))
  .get("/questions", async (c) => {
    const allQuestions = await db.query.questions.findMany({
      orderBy: (questions, { desc }) => [desc(questions.createdAt)],
    });

    const groupedTopics = allQuestions.reduce<Record<string, {
      topic: string;
      totalQuestions: number;
      latestCreatedAt: string;
      questions: Array<{
        id: string;
        type: string;
        text: string;
        options: string[];
        correctAnswer: string;
        explanation: string | null;
        status: string;
        createdAt: string;
      }>;
    }>>((acc, question) => {
      const topic = question.moduleId || "General Practice";
      if (!acc[topic]) {
        acc[topic] = {
          topic,
          totalQuestions: 0,
          latestCreatedAt: question.createdAt,
          questions: [],
        };
      }

      acc[topic].totalQuestions += 1;
      acc[topic].questions.push({
        id: question.id,
        type: question.type,
        text: question.text,
        options: parseQuestionOptions(question.options),
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
        status: question.status,
        createdAt: question.createdAt,
      });
      return acc;
    }, {});

    return c.json({
      topics: Object.values(groupedTopics),
    });
  });

export type AppType = typeof app;
export default app;
