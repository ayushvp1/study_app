import { db } from "./index";
import { modules, questions } from "./schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function ensureMultiplicationModule() {
  try {
    const moduleId = "multiplications-1-30";
    
    // Check if the module already exists
    const existingModule = await db.query.modules.findFirst({
      where: eq(modules.id, moduleId),
    });

    if (existingModule) {
      console.log("ℹ️ Multiplication module (1-30) already exists in database.");
      return;
    }

    console.log("🌱 Seeding Multiplication Tables (1-30) module...");

    // 1. Insert module
    await db.insert(modules).values({
      id: moduleId,
      title: "Multiplication Tables (1-30)",
      content: "Master your multiplication tables from 1 to 30. Learn the concepts, explore advanced study hacks, and practice questions to build lightning-fast mental math speed.",
      createdAt: new Date().toISOString(),
    });

    // 2. Generate 30 questions (one for each table N from 1 to 30)
    const questionsToInsert = [];

    for (let N = 1; N <= 30; N++) {
      // Deterministically select a multiplier M between 3 and 12
      // Using a formula to keep it stable and diverse
      const M = ((N * 7 + 3) % 10) + 3;
      const correctAnswerVal = N * M;

      // Generate options deterministically
      const optSet = new Set<number>();
      optSet.add(correctAnswerVal);

      // Distractor 1: (M + 1) * N or (M - 1) * N
      const d1 = M < 12 ? (M + 1) * N : (M - 1) * N;
      optSet.add(d1);

      // Distractor 2: (M - 2) * N if M > 4 else (M + 2) * N
      const d2 = M > 4 ? (M - 2) * N : (M + 2) * N;
      optSet.add(d2);

      // Distractor 3: N * M +/- 10 or +/- 5
      const offset = N > 5 ? 10 : 5;
      const d3 = correctAnswerVal + offset;
      const d4 = correctAnswerVal - offset > 0 ? correctAnswerVal - offset : correctAnswerVal + offset * 2;
      optSet.add(d3);
      optSet.add(d4);

      // Convert set to array, sort numerically, and pick top 4 options
      const sortedOptions = Array.from(optSet)
        .sort((a, b) => a - b)
        .slice(0, 4)
        .map(val => String(val));

      // If for some reason we don't have 4 unique options, fill with simple offsets
      while (sortedOptions.length < 4) {
        const lastVal = Number(sortedOptions[sortedOptions.length - 1] || correctAnswerVal);
        sortedOptions.push(String(lastVal + N));
      }

      // Re-add correct answer just in case and re-sort
      if (!sortedOptions.includes(String(correctAnswerVal))) {
        sortedOptions[0] = String(correctAnswerVal);
        sortedOptions.sort((a, b) => Number(a) - Number(b));
      }

      questionsToInsert.push({
        id: `mult-q-${N}`,
        type: "type1" as const, // Multiple choice
        text: `What is the correct result of: ${N} × ${M}?`,
        options: JSON.stringify(sortedOptions),
        correctAnswer: String(correctAnswerVal),
        explanation: `We know that ${N} × ${M} = ${correctAnswerVal}. An easy way to calculate this mentally is: ` +
          (N > 10 
            ? `break ${N} down into (10 + ${N - 10}) × ${M} = (${10 * M} + ${(N - 10) * M}) = ${correctAnswerVal}.` 
            : `add the number ${N} to itself ${M} times.`),
        status: "published" as const,
        moduleId: moduleId,
        createdAt: new Date().toISOString(),
      });
    }

    // Insert all generated questions
    await db.insert(questions).values(questionsToInsert);
    console.log(`✅ Successfully seeded 30 multiplication questions for tables 1 to 30.`);
  } catch (error) {
    console.error("❌ Failed to seed multiplication module:", error);
  }
}
