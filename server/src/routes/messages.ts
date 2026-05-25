import { Hono } from "hono";
import { db } from "../db";
import { messages, users } from "../db/schema";
import { nanoid } from "nanoid";
import { eq, or, and } from "drizzle-orm";
import { jwt } from "hono/jwt";

const JWT_SECRET = "super-secret-key";

const messenger = new Hono()
  .use("/*", jwt({ secret: JWT_SECRET, alg: "HS256" }))
  // Get chat history for the current user
  .get("/", async (c) => {
    const payload = c.get("jwtPayload") as any;
    const userId = payload.id;
    
    const chatMessages = await db.query.messages.findMany({
      where: or(eq(messages.senderId, userId), eq(messages.receiverId, userId), eq(messages.receiverId, null as any)),
      with: {
        sender: {
          columns: { name: true, role: true }
        }
      },
      orderBy: (messages, { asc }) => [asc(messages.createdAt)],
    });
    
    return c.json(chatMessages);
  })
  // Send a message
  .post("/", async (c) => {
    const payload = c.get("jwtPayload") as any;
    const { receiverId, content } = await c.req.json();
    
    if (!content) return c.json({ error: "Content is required" }, 400);

    // If student is sending, they must send to an admin
    if (payload.role === "student" && receiverId) {
       // Optional: verify receiver is admin
    }

    const messageId = nanoid();
    await db.insert(messages).values({
      id: messageId,
      senderId: payload.id,
      receiverId: receiverId || null, // null means broadcast to all students
      content,
      createdAt: new Date().toISOString(),
    });
    
    return c.json({ success: true, id: messageId });
  })
  // Admin only: get all students to start chats
  .get("/students", async (c) => {
    const payload = c.get("jwtPayload") as any;
    if (payload.role !== "admin") return c.json({ error: "Forbidden" }, 403);
    
    const students = await db.query.users.findMany({
      where: eq(users.role, "student"),
      columns: { id: true, name: true, email: true, phone: true }
    });
    
    return c.json(students);
  });

export default messenger;
