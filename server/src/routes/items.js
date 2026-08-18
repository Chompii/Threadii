import { Router } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { nanoid } from "nanoid";
import db from "../db.js";
import { sanitizeTags, serializeItem } from "../tags.js";
import { UPLOADS_DIR as uploadsDir } from "../paths.js";

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
  fileFilter: (_req, file, cb) => {
    cb(null, ALLOWED_MIME.has(file.mimetype));
  },
});

const CATEGORIES = new Set(["top", "bottom", "dress", "outerwear", "shoes", "accessory"]);
const SEASONS = new Set(["all", "spring", "summer", "fall", "winter"]);
const OCCASIONS = new Set(["casual", "formal", "sport", "all"]);
const FITS = new Set(["fitted", "regular", "relaxed"]);

const router = Router();

router.get("/", (req, res) => {
  const archived = req.query.archived === "true" ? 1 : 0;
  const items = db
    .prepare("SELECT * FROM items WHERE user_id = ? AND archived = ? ORDER BY created_at DESC")
    .all(req.userId, archived);
  res.json(items.map(serializeItem));
});

router.post("/", upload.single("image"), (req, res) => {
  const { name, category, color, season = "all", occasion = "casual", fit = "regular", tags } = req.body;

  if (!name || !category || !color) {
    return res.status(400).json({ error: "name, category, and color are required" });
  }
  if (!CATEGORIES.has(category)) {
    return res.status(400).json({ error: `category must be one of: ${[...CATEGORIES].join(", ")}` });
  }
  if (!SEASONS.has(season)) {
    return res.status(400).json({ error: `season must be one of: ${[...SEASONS].join(", ")}` });
  }
  if (!OCCASIONS.has(occasion)) {
    return res.status(400).json({ error: `occasion must be one of: ${[...OCCASIONS].join(", ")}` });
  }
  if (!FITS.has(fit)) {
    return res.status(400).json({ error: `fit must be one of: ${[...FITS].join(", ")}` });
  }

  const id = nanoid();
  const imagePath = req.file ? `/uploads/${req.file.filename}` : null;
  const tagsJson = JSON.stringify(sanitizeTags(tags));

  db.prepare(
    `INSERT INTO items (id, user_id, name, category, color, season, occasion, fit, image_path, tags)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, req.userId, name, category, color.toLowerCase(), season, occasion, fit, imagePath, tagsJson);

  const item = db.prepare("SELECT * FROM items WHERE id = ?").get(id);
  res.status(201).json(serializeItem(item));
});

router.patch("/:id", upload.single("image"), (req, res) => {
  const existing = db
    .prepare("SELECT * FROM items WHERE id = ? AND user_id = ?")
    .get(req.params.id, req.userId);
  if (!existing) return res.status(404).json({ error: "not found" });

  const { name, category, color, season = "all", occasion = "casual", fit = "regular", tags } = req.body;

  if (!name || !category || !color) {
    return res.status(400).json({ error: "name, category, and color are required" });
  }
  if (!CATEGORIES.has(category)) {
    return res.status(400).json({ error: `category must be one of: ${[...CATEGORIES].join(", ")}` });
  }
  if (!SEASONS.has(season)) {
    return res.status(400).json({ error: `season must be one of: ${[...SEASONS].join(", ")}` });
  }
  if (!OCCASIONS.has(occasion)) {
    return res.status(400).json({ error: `occasion must be one of: ${[...OCCASIONS].join(", ")}` });
  }
  if (!FITS.has(fit)) {
    return res.status(400).json({ error: `fit must be one of: ${[...FITS].join(", ")}` });
  }

  let imagePath = existing.image_path;
  if (req.file) {
    imagePath = `/uploads/${req.file.filename}`;
    if (existing.image_path) {
      const oldPath = path.join(uploadsDir, path.basename(existing.image_path));
      fs.rm(oldPath, { force: true }, () => {});
    }
  }

  const tagsJson = JSON.stringify(sanitizeTags(tags));

  db.prepare(
    `UPDATE items SET name = ?, category = ?, color = ?, season = ?, occasion = ?, fit = ?, image_path = ?, tags = ?
     WHERE id = ? AND user_id = ?`
  ).run(
    name,
    category,
    color.toLowerCase(),
    season,
    occasion,
    fit,
    imagePath,
    tagsJson,
    req.params.id,
    req.userId
  );

  const updated = db.prepare("SELECT * FROM items WHERE id = ?").get(req.params.id);
  res.json(serializeItem(updated));
});

router.patch("/:id/laundry", (req, res) => {
  const existing = db
    .prepare("SELECT * FROM items WHERE id = ? AND user_id = ?")
    .get(req.params.id, req.userId);
  if (!existing) return res.status(404).json({ error: "not found" });

  const { inLaundry } = req.body;
  if (typeof inLaundry !== "boolean") {
    return res.status(400).json({ error: "inLaundry must be a boolean" });
  }

  db.prepare("UPDATE items SET in_laundry = ? WHERE id = ? AND user_id = ?").run(
    inLaundry ? 1 : 0,
    req.params.id,
    req.userId
  );

  const updated = db.prepare("SELECT * FROM items WHERE id = ?").get(req.params.id);
  res.json(serializeItem(updated));
});

router.patch("/:id/archive", (req, res) => {
  const existing = db
    .prepare("SELECT * FROM items WHERE id = ? AND user_id = ?")
    .get(req.params.id, req.userId);
  if (!existing) return res.status(404).json({ error: "not found" });

  const { archived } = req.body;
  if (typeof archived !== "boolean") {
    return res.status(400).json({ error: "archived must be a boolean" });
  }

  db.prepare("UPDATE items SET archived = ? WHERE id = ? AND user_id = ?").run(
    archived ? 1 : 0,
    req.params.id,
    req.userId
  );

  const updated = db.prepare("SELECT * FROM items WHERE id = ?").get(req.params.id);
  res.json(serializeItem(updated));
});

router.delete("/:id", (req, res) => {
  const item = db
    .prepare("SELECT * FROM items WHERE id = ? AND user_id = ?")
    .get(req.params.id, req.userId);
  if (!item) return res.status(404).json({ error: "not found" });

  if (item.image_path) {
    const filePath = path.join(uploadsDir, path.basename(item.image_path));
    fs.rm(filePath, { force: true }, () => {});
  }

  db.prepare("DELETE FROM items WHERE id = ? AND user_id = ?").run(req.params.id, req.userId);
  res.status(204).end();
});

export default router;
