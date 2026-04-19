import { db } from "./index";
import { users } from "./schema";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";

async function createUser(email: string, passwordRaw: string, name: string, role: "admin" | "student") {
  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (existing) {
    console.log(`ℹ️ User ${email} already exists.`);
    return;
  }
  
  await db.insert(users).values({
    id: nanoid(),
    email,
    password: await Bun.password.hash(passwordRaw),
    name,
    role,
    createdAt: new Date().toISOString(),
  });
  console.log(`✅ ${role} account created: ${email}`);
}

async function seed() {
  console.log("🌱 Seeding Accounts...");
  await createUser("admin@platform.com", "admin123", "Super Admin", "admin");
  await createUser("student@platform.com", "student123", "Normal Student", "student");
  console.log("✨ Seeding complete!");
}

seed();
