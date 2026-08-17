import db from "../db.js";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "not authenticated" });

  const session = db
    .prepare("SELECT * FROM sessions WHERE token = ? AND expires_at > datetime('now')")
    .get(token);
  if (!session) return res.status(401).json({ error: "session expired" });

  req.userId = session.user_id;
  req.token = token;
  next();
}
