import { Router } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { nanoid } from "nanoid";
import db from "../db.js";
import { UPLOADS_DIR as uploadsDir } from "../paths.js";
import { describeInspirationImage } from "../aiRank.js";

fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `${nanoid()}${ext}`);
  },
});

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, ALLOWED_MIME.has(file.mimetype)),
});

const MAX_INSPIRATION_IMAGES = 3;

function serialize(row) {
  return { id: row.id, image_path: row.image_path, descriptor: row.descriptor, created_at: row.created_at };
}

const router = Router();

router.get("/", (req, res) => {
  const rows = db
    .prepare("SELECT * FROM inspiration_images WHERE user_id = ? ORDER BY created_at DESC")
    .all(req.userId);
  res.json(rows.map(serialize));
});

router.post("/", upload.single("image"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "image is required" });

  const count = db
    .prepare("SELECT COUNT(*) as n FROM inspiration_images WHERE user_id = ?")
    .get(req.userId).n;
  if (count >= MAX_INSPIRATION_IMAGES) {
    fs.rm(req.file.path, { force: true }, () => {});
    return res
      .status(400)
      .json({ error: `you can add up to ${MAX_INSPIRATION_IMAGES} inspiration photos — remove one first` });
  }

  const imagePath = `/uploads/${req.file.filename}`;
  // Analyzed once at upload time (not per-suggestion) since it's the same
  // image every time — the descriptor gets reused as ranking context later.
  const buffer = fs.readFileSync(req.file.path);
  const descriptor = await describeInspirationImage(buffer, req.file.mimetype);

  const id = nanoid();
  db.prepare(
    "INSERT INTO inspiration_images (id, user_id, image_path, descriptor) VALUES (?, ?, ?, ?)"
  ).run(id, req.userId, imagePath, descriptor);

  const row = db.prepare("SELECT * FROM inspiration_images WHERE id = ?").get(id);
  res.status(201).json(serialize(row));
});

router.delete("/:id", (req, res) => {
  const row = db
    .prepare("SELECT * FROM inspiration_images WHERE id = ? AND user_id = ?")
    .get(req.params.id, req.userId);
  if (!row) return res.status(404).json({ error: "not found" });

  if (row.image_path) {
    const filePath = path.join(uploadsDir, path.basename(row.image_path));
    fs.rm(filePath, { force: true }, () => {});
  }
  db.prepare("DELETE FROM inspiration_images WHERE id = ?").run(req.params.id);
  res.status(204).end();
});

export default router;
