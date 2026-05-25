import { Hono } from "hono";
import { sign } from "hono/jwt";
import { db } from "../db";
import { users, resetTokens } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { sendOTPEmail } from "../lib/mailer";

const JWT_SECRET = "super-secret-key";

const auth = new Hono()
  .post("/register", async (c) => {
    const { email, password, name, phone } = await c.req.json();
    const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (existing) return c.json({ error: "User already exists" }, 400);

    const hashedPassword = await Bun.password.hash(password);
    await db.insert(users).values({
      id: nanoid(),
      email,
      password: hashedPassword,
      name,
      phone,
      role: "student",
      createdAt: new Date().toISOString(),
    });
    return c.json({ success: true });
  })
  .post("/login", async (c) => {
    const { email, password } = await c.req.json();
    const user = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (!user || !(await Bun.password.verify(password, user.password))) {
      return c.json({ error: "Invalid credentials" }, 401);
    }
    const token = await sign({ id: user.id, role: user.role, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 }, JWT_SECRET);
    return c.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  })
  .post("/forgot-password", async (c) => {
    const { email } = await c.req.json();
    const user = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (!user) return c.json({ error: "No account found with this email. Please sign up first." }, 404);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 mins

    await db.delete(resetTokens).where(eq(resetTokens.email, email));
    await db.insert(resetTokens).values({ id: nanoid(), email, otp, expiresAt });
    
    try {
      await sendOTPEmail(email, otp);
      return c.json({ success: true, message: "OTP sent to your email" });
    } catch (error: any) {
      return c.json({ error: error.message || "Failed to send email" }, 500);
    }
  })
  .post("/reset-password", async (c) => {
    const { email, otp, newPassword } = await c.req.json();
    const token = await db.query.resetTokens.findFirst({
      where: and(eq(resetTokens.email, email), eq(resetTokens.otp, otp))
    });

    if (!token || token.expiresAt < Date.now()) {
      return c.json({ error: "Invalid or expired OTP" }, 400);
    }

    const hashedPassword = await Bun.password.hash(newPassword);
    await db.update(users).set({ password: hashedPassword }).where(eq(users.email, email));
    await db.delete(resetTokens).where(eq(resetTokens.email, email));

    return c.json({ success: true, message: "Password reset successful" });
  })
  .post("/demo-send-otp", async (c) => {
    const email = "demo@platform.com";
    
    // Ensure the demo user exists
    const user = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (!user) {
      await db.insert(users).values({
        id: "demo-user-id",
        email,
        password: await Bun.password.hash("demo123"),
        name: "Demo Developer",
        role: "student",
        createdAt: new Date().toISOString(),
      });
    }

    // Generate a random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 mins

    await db.delete(resetTokens).where(eq(resetTokens.email, email));
    await db.insert(resetTokens).values({ id: nanoid(), email, otp, expiresAt });

    console.log(`🔑 [DEV ONLY] Demo Login OTP created for demo@platform.com: ${otp}`);
    return c.json({ success: true, otp, message: "Demo OTP created successfully!" });
  })
  .post("/demo-verify-otp", async (c) => {
    const email = "demo@platform.com";
    const { otp } = await c.req.json();

    const tokenRecord = await db.query.resetTokens.findFirst({
      where: and(eq(resetTokens.email, email), eq(resetTokens.otp, otp))
    });

    if (!tokenRecord || tokenRecord.expiresAt < Date.now()) {
      return c.json({ error: "Invalid or expired OTP code." }, 400);
    }

    // Success! Let's log in
    const user = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (!user) return c.json({ error: "Demo user not found." }, 404);

    await db.delete(resetTokens).where(eq(resetTokens.email, email));

    const token = await sign({ id: user.id, role: user.role, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 }, JWT_SECRET); // 7 days token
    return c.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  });

// Automatically ensure demo user exists on module load
async function ensureDemoUser() {
  const email = "demo@platform.com";
  try {
    const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (!existing) {
      await db.insert(users).values({
        id: "demo-user-id",
        email,
        password: await Bun.password.hash("demo123"),
        name: "Demo Developer",
        role: "student",
        createdAt: new Date().toISOString(),
      });
      console.log("✅ Seeded demo account: demo@platform.com");
    }
  } catch (error) {
    console.error("Failed to seed demo user:", error);
  }
}
ensureDemoUser();

export default auth;
