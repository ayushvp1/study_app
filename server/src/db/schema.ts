import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role", { enum: ["admin", "student"] }).notNull().default("student"),
  createdAt: text("created_at").notNull(),
});

export const questions = sqliteTable("questions", {
  id: text("id").primaryKey(),
  type: text("type", { enum: ["type1", "type2", "type3", "type4", "type5"] }).notNull(),
  text: text("text").notNull(),
  options: text("options"), // JSON string array
  correctAnswer: text("correct_answer").notNull(),
  explanation: text("explanation"),
  status: text("status", { enum: ["draft", "published"] }).notNull().default("draft"),
  moduleId: text("module_id"),
  videoUrl: text("video_url"),
  createdAt: text("created_at").notNull(),
});

export const attempts = sqliteTable("attempts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  questionId: text("question_id").notNull().references(() => questions.id),
  answer: text("answer").notNull(),
  isCorrect: integer("is_correct", { mode: "boolean" }).notNull(),
  attemptedAt: text("attempted_at").notNull(),
});

export const resetTokens = sqliteTable("reset_tokens", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  otp: text("otp").notNull(),
  expiresAt: integer("expires_at").notNull(), // Timestamp
});
