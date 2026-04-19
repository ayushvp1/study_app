import { Hono } from "hono";
import { db } from "../db";
import { attempts } from "../db/schema";
import { eq, and, gte, sql } from "drizzle-orm";
import { jwt } from "hono/jwt";

const JWT_SECRET = "super-secret-key";

const stats = new Hono()
  .use("/*", jwt({ secret: JWT_SECRET }))
  .get("/summary", async (c) => {
    const payload = c.get("jwtPayload") as any;
    const userId = payload.id;

    // 1. Get all attempts for user
    const userAttempts = await db.query.attempts.findMany({
      where: eq(attempts.userId, userId),
    });

    // 2. Calculate Stats
    const total = userAttempts.length;
    const correct = userAttempts.filter(a => a.isCorrect).length;
    const accuracy = total > 0 ? (correct / total) * 100 : 0;
    
    // 3. Activity for last 7 days
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    const activity = last7Days.map(day => ({
      day: day.split('-').slice(1).join('/'), // MM/DD format
      count: userAttempts.filter(a => a.attemptedAt.startsWith(day)).length
    }));

    // 4. Mastery (simple logic for now)
    const mastery = correct * 10;

    // 5. Streak (simplified: consecutive days with attempts)
    let streak = 0;
    const attemptDates = new Set(userAttempts.map(a => a.attemptedAt.split('T')[0]));
    let checkDate = new Date();
    while (attemptDates.has(checkDate.toISOString().split('T')[0])) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    return c.json({
      streak: `${streak} Days`,
      mastery: mastery.toString(),
      totalQuizzes: [...new Set(userAttempts.map(a => a.questionId))].length.toString(),
      accuracy: `${accuracy.toFixed(1)}%`,
      activity
    });
  });

export default stats;
