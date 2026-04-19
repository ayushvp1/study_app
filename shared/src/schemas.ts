import { z } from "zod";

export const UserRoleSchema = z.enum(["admin", "student"]);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const QuestionTypeSchema = z.enum([
  "type1", // Multiple Choice
  "type2", // True/False
  "type3", // Short Answer
  "type4", // Multiple Select
  "type5", // Match the following
]);
export type QuestionType = z.infer<typeof QuestionTypeSchema>;

export const QuestionStatusSchema = z.enum(["draft", "published"]);
export type QuestionStatus = z.infer<typeof QuestionStatusSchema>;

export const QuestionSchema = z.object({
  id: z.string(),
  type: QuestionTypeSchema,
  text: z.string(),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string(),
  explanation: z.string().optional(),
  status: QuestionStatusSchema.default("draft"),
  moduleId: z.string().optional(),
  videoUrl: z.string().url().nullable().optional(),
  createdAt: z.string().datetime(),
});

export type Question = z.infer<typeof QuestionSchema>;

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  role: UserRoleSchema.default("student"),
});

export type User = z.infer<typeof UserSchema>;

export const AttemptSchema = z.object({
  id: z.string(),
  userId: z.string(),
  questionId: z.string(),
  answer: z.string(),
  isCorrect: z.boolean(),
  attemptedAt: z.string().datetime(),
});

export type Attempt = z.infer<typeof AttemptSchema>;
