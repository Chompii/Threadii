import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { DB_PATH } from "./paths.js";

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
const db = new DatabaseSync(DB_PATH);

db.exec("PRAGMA journal_mode = WAL;");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at TEXT NOT NULL
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS items (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    color TEXT NOT NULL,
    season TEXT NOT NULL DEFAULT 'all',
    occasion TEXT NOT NULL DEFAULT 'casual',
    image_path TEXT,
    tags TEXT NOT NULL DEFAULT '[]',
    in_laundry INTEGER NOT NULL DEFAULT 0,
    archived INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS favorites (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    item_ids TEXT NOT NULL,
    note TEXT NOT NULL DEFAULT '',
    collection TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS worn (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    item_ids TEXT NOT NULL,
    worn_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS dislikes (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    item_ids TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS planned_outfits (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    planned_date TEXT NOT NULL,
    item_ids TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, planned_date)
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS packing_lists (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    item_ids TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// Up to 5 outfits (picked from the user's own closet) that represent what
// they actually like to wear — used to derive a lightweight style profile
// that nudges suggestion scoring/ranking. Capped at 5 in the route layer.
db.exec(`
  CREATE TABLE IF NOT EXISTS style_picks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    item_ids TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// Reference photos (Pinterest screenshots, etc.) the user uploads as "the
// look I want" — each gets a Gemini vision description on upload, which is
// then used as a soft style signal on the AI ranking prompt. Capped at 3 in
// the route layer to keep the ranking prompt from ballooning.
db.exec(`
  CREATE TABLE IF NOT EXISTS inspiration_images (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    image_path TEXT NOT NULL,
    descriptor TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// Migrations for databases created before these columns existed.
const migrations = [
  "ALTER TABLE favorites ADD COLUMN note TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE items ADD COLUMN user_id TEXT",
  "ALTER TABLE favorites ADD COLUMN user_id TEXT",
  "ALTER TABLE worn ADD COLUMN user_id TEXT",
  "ALTER TABLE items ADD COLUMN tags TEXT NOT NULL DEFAULT '[]'",
  "ALTER TABLE items ADD COLUMN in_laundry INTEGER NOT NULL DEFAULT 0",
  "ALTER TABLE items ADD COLUMN archived INTEGER NOT NULL DEFAULT 0",
  "ALTER TABLE favorites ADD COLUMN collection TEXT",
  "ALTER TABLE items ADD COLUMN fit TEXT NOT NULL DEFAULT 'regular'",
];
for (const sql of migrations) {
  try {
    db.exec(sql);
  } catch {
    // column already exists
  }
}

export default db;
