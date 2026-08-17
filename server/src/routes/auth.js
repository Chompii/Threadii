import { Router } from "express";
import { nanoid } from "nanoid";
import db from "../db.js";
import { hashPassword, verifyPassword, generateToken } from "../auth.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const SESSION_DAYS = 30;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function createSession(userId) {
  const token = generateToken();
  db.prepare(
    `INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, datetime('now', '+${SESSION_DAYS} days'))`
  ).run(token, userId);
  return token;
}

function publicUser(row) {
  return { id: row.id, email: row.email, createdAt: row.created_at };
}

router.post("/signup", (req, res) => {
  const { email, password } = req.body;
  if (!email || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: "a valid email is required" });
  }
  if (!password || password.length < 8) {
    return res.status(400).json({ error: "password must be at least 8 characters" });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(normalizedEmail);
  if (existing) {
    return res.status(409).json({ error: "an account with that email already exists" });
  }

  const isFirstUser = db.prepare("SELECT COUNT(*) AS count FROM users").get().count === 0;

  const id = nanoid();
  db.prepare("INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)").run(
    id,
    normalizedEmail,
    hashPassword(password)
  );

  // The very first account claims any closet data that was created before
  // accounts existed, so nothing gets orphaned.
  if (isFirstUser) {
    db.prepare("UPDATE items SET user_id = ? WHERE user_id IS NULL").run(id);
    db.prepare("UPDATE favorites SET user_id = ? WHERE user_id IS NULL").run(id);
    db.prepare("UPDATE worn SET user_id = ? WHERE user_id IS NULL").run(id);
  }

  const token = createSession(id);
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
  res.status(201).json({ token, user: publicUser(user) });
});

router.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(normalizedEmail);
  if (!user || !verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: "incorrect email or password" });
  }

  const token = createSession(user.id);
  res.json({ token, user: publicUser(user) });
});

router.post("/logout", requireAuth, (req, res) => {
  db.prepare("DELETE FROM sessions WHERE token = ?").run(req.token);
  res.status(204).end();
});

router.get("/me", requireAuth, (req, res) => {
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.userId);
  if (!user) return res.status(401).json({ error: "not authenticated" });
  res.json({ user: publicUser(user) });
});

export default router;
