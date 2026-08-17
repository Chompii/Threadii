import { Router } from "express";
import { nanoid } from "nanoid";
import db from "../db.js";
import { scoreOutfit } from "../colors.js";
import { describeOutfit } from "../describe.js";
import { serializeItem } from "../tags.js";

const router = Router();

function hydrate(row) {
  const ids = JSON.parse(row.item_ids);
  const placeholders = ids.map(() => "?").join(",");
  const pieces = ids.length
    ? db.prepare(`SELECT * FROM items WHERE id IN (${placeholders})`).all(...ids).map(serializeItem)
    : [];
  // preserve original save order, drop pieces for items that got deleted since
  const byId = new Map(pieces.map((p) => [p.id, p]));
  const orderedPieces = ids.map((id) => byId.get(id)).filter(Boolean);
  const result = scoreOutfit(orderedPieces.map((p) => p.color));

  return {
    id: row.id,
    pieces: orderedPieces,
    score: result.score,
    harmony: result.harmony,
    description: describeOutfit(orderedPieces, result),
    note: row.note || "",
    collection: row.collection || null,
    created_at: row.created_at,
  };
}

router.get("/", (req, res) => {
  const rows = db
    .prepare("SELECT * FROM favorites WHERE user_id = ? ORDER BY created_at DESC")
    .all(req.userId);
  res.json(rows.map(hydrate));
});

router.post("/", (req, res) => {
  const { itemIds, note = "", collection = null } = req.body;
  if (!Array.isArray(itemIds) || itemIds.length === 0) {
    return res.status(400).json({ error: "itemIds must be a non-empty array" });
  }

  const placeholders = itemIds.map(() => "?").join(",");
  const found = db
    .prepare(`SELECT id FROM items WHERE id IN (${placeholders}) AND user_id = ?`)
    .all(...itemIds, req.userId);
  if (found.length !== itemIds.length) {
    return res.status(400).json({ error: "one or more items not found" });
  }

  const id = nanoid();
  const normalizedCollection = collection && collection.trim() ? collection.trim() : null;
  db.prepare(
    "INSERT INTO favorites (id, user_id, item_ids, note, collection) VALUES (?, ?, ?, ?, ?)"
  ).run(id, req.userId, JSON.stringify(itemIds), note, normalizedCollection);

  const row = db.prepare("SELECT * FROM favorites WHERE id = ?").get(id);
  res.status(201).json(hydrate(row));
});

router.patch("/:id", (req, res) => {
  const row = db
    .prepare("SELECT * FROM favorites WHERE id = ? AND user_id = ?")
    .get(req.params.id, req.userId);
  if (!row) return res.status(404).json({ error: "not found" });

  const { note, collection } = req.body;

  if (note !== undefined) {
    if (typeof note !== "string") {
      return res.status(400).json({ error: "note must be a string" });
    }
    db.prepare("UPDATE favorites SET note = ? WHERE id = ?").run(note, req.params.id);
  }

  if (collection !== undefined) {
    if (collection !== null && typeof collection !== "string") {
      return res.status(400).json({ error: "collection must be a string or null" });
    }
    const normalized = collection && collection.trim() ? collection.trim() : null;
    db.prepare("UPDATE favorites SET collection = ? WHERE id = ?").run(normalized, req.params.id);
  }

  const updated = db.prepare("SELECT * FROM favorites WHERE id = ?").get(req.params.id);
  res.json(hydrate(updated));
});

router.delete("/:id", (req, res) => {
  const row = db
    .prepare("SELECT * FROM favorites WHERE id = ? AND user_id = ?")
    .get(req.params.id, req.userId);
  if (!row) return res.status(404).json({ error: "not found" });

  db.prepare("DELETE FROM favorites WHERE id = ?").run(req.params.id);
  res.status(204).end();
});

export default router;
