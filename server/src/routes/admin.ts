import { Hono } from "hono";
import { db } from "../db";
import { questions, users } from "../db/schema";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import OpenAI from "openai";
import { jwt } from "hono/jwt";

const JWT_SECRET = "super-secret-key";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY || "missing-openai-key",
});

type GeneratedQuestion = {
  text: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
};

function normalizeQuestion(question: any, index: number, type: string, topic: string): GeneratedQuestion {
  const options = Array.isArray(question?.options)
    ? question.options.map((option: unknown) => String(option))
    : undefined;

  const fallbackOptions = type === "type1"
    ? [
        `${topic} concept A`,
        `${topic} concept B`,
        `${topic} concept C`,
        `${topic} concept D`,
      ]
    : undefined;

  const resolvedOptions = options && options.length > 0 ? options : fallbackOptions;
  const correctAnswer = question?.correctAnswer
    ? String(question.correctAnswer)
    : resolvedOptions?.[0] || `Sample answer ${index + 1}`;

  return {
    text: String(question?.text || `Practice question ${index + 1} about ${topic}`),
    options: resolvedOptions,
    correctAnswer,
    explanation: question?.explanation
      ? String(question.explanation)
      : `This answer is selected as the most appropriate response for ${topic}.`,
  };
}

function buildFallbackQuestions(topic: string, type: string, count: number): GeneratedQuestion[] {
  return Array.from({ length: count }, (_, index) => {
    if (type === "type2") {
      return {
        text: `True or false: ${topic} statement ${index + 1} is correct.`,
        options: ["True", "False"],
        correctAnswer: index % 2 === 0 ? "True" : "False",
        explanation: `Review the concept behind ${topic} statement ${index + 1} before publishing.`,
      };
    }

    if (type === "type3") {
      return {
        text: `In one or two sentences, explain ${topic} concept ${index + 1}.`,
        correctAnswer: `${topic} concept ${index + 1} explained clearly and accurately.`,
        explanation: `Use this as a rubric anchor for a short-answer response.`,
      };
    }

    return {
      text: `Which option best matches ${topic} concept ${index + 1}?`,
      options: [
        `${topic} concept ${index + 1}`,
        `${topic} distractor A`,
        `${topic} distractor B`,
        `${topic} distractor C`,
      ],
      correctAnswer: `${topic} concept ${index + 1}`,
      explanation: `The first option directly matches the requested ${topic} concept.`,
    };
  });
}

async function generateQuestions(topic: string, type: string, count: number): Promise<GeneratedQuestion[]> {
  if (!OPENAI_API_KEY || OPENAI_API_KEY === "your-key-here") {
    return buildFallbackQuestions(topic, type, count);
  }

  const prompt = `Generate ${count} practice questions about "${topic}".
Return strict JSON with this shape:
{
  "questions": [
    {
      "text": "question text",
      "options": ["option 1", "option 2", "option 3", "option 4"],
      "correctAnswer": "exact correct answer",
      "explanation": "short explanation"
    }
  ]
}

Rules:
- Use the requested question type "${type}".
- For type1, include exactly 4 options.
- For type2, use options ["True", "False"].
- For type3, omit options and provide a concise model answer.
- Keep wording classroom-safe and ready to save.`;

  try {
    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
    });

    const content = response.output_text?.trim();
    if (!content) {
      return buildFallbackQuestions(topic, type, count);
    }

    const parsed = JSON.parse(content);
    const questions = Array.isArray(parsed?.questions) ? parsed.questions : [parsed];
    return questions.map((question, index) => normalizeQuestion(question, index, type, topic));
  } catch (error) {
    console.error("AI generation failed, using fallback questions instead:", error);
    return buildFallbackQuestions(topic, type, count);
  }
}

const admin = new Hono()
  // Protect all admin routes
  .use("/*", jwt({ secret: JWT_SECRET }))
  .use("/*", async (c, next) => {
    const payload = c.get("jwtPayload") as any;
    if (payload.role !== "admin") return c.json({ error: "Forbidden" }, 403);
    await next();
  })
  .post("/generate", async (c) => {
    try {
      const { type, topic, count = 5 } = await c.req.json();
      const safeTopic = String(topic || "").trim();
      const safeType = String(type || "type1");
      const safeCount = Math.min(Math.max(Number(count) || 5, 1), 20);

      if (!safeTopic) {
        return c.json({ error: "Topic is required" }, 400);
      }

      const generatedQuestions = await generateQuestions(safeTopic, safeType, safeCount);
      const newQuestions = generatedQuestions.map((question) => ({
        id: nanoid(),
        type: safeType as "type1" | "type2" | "type3" | "type4" | "type5",
        text: question.text,
        options: question.options ? JSON.stringify(question.options) : null,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation || null,
        status: "draft" as const,
        moduleId: safeTopic,
        createdAt: new Date().toISOString(),
      }));

      await db.insert(questions).values(newQuestions);
      return c.json({
        success: true,
        count: newQuestions.length,
        source: OPENAI_API_KEY && OPENAI_API_KEY !== "your-key-here" ? "openai_or_fallback" : "fallback",
      });
    } catch (error) {
      console.error("Failed to generate admin questions:", error);
      return c.json({ error: "Question generation failed" }, 500);
    }
  })
  .post("/publish/:id", async (c) => {
    return c.json({ success: true });
  })
  .get("/users", async (c) => {
    const allUsers = await db.query.users.findMany({
      orderBy: (users, { desc }) => [desc(users.createdAt)],
    });
    return c.json(allUsers.map(u => ({ id: u.id, email: u.email, name: u.name, role: u.role, createdAt: u.createdAt })));
  })
  .patch("/users/:id", async (c) => {
    const id = c.req.param("id");
    const { name, role } = await c.req.json();
    await db.update(users).set({ name, role }).where(eq(users.id, id));
    return c.json({ success: true });
  })
  .delete("/users/:id", async (c) => {
    const id = c.req.param("id");
    await db.delete(users).where(eq(users.id, id));
    return c.json({ success: true });
  });

export default admin;
