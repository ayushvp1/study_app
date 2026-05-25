import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";
import * as schema from "./schema";

const sqlite = new Database("sqlite.db");

// Automatically ensure the recitations table exists
sqlite.run(`
  CREATE TABLE IF NOT EXISTS recitations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    table_number INTEGER NOT NULL,
    count INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL
  )
`);

export const db = drizzle(sqlite, { schema });
