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
    const { email, password, name } = await c.req.json();
    const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (existing) return c.json({ error: "User already exists" }, 400);

    const hashedPassword = await Bun.password.hash(password);
    await db.insert(users).values({
      id: nanoid(),
      email,
      password: hashedPassword,
      name,
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
  });

export default auth;
