import { Router } from "express";
import { nanoid } from "nanoid";
import db from "../db.js";
import { scoreOutfit } from "../colors.js";
import { describeOutfit } from "../describe.js";
import { serializeItem } from "../tags.js";

const router = Router();
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function hydrate(row) {
  const ids = JSON.parse(row.item_ids);
  const placeholders = ids.map(() => "?").join(",");
  const pieces = ids.length
    ? db.prepare(`SELECT * FROM items WHERE id IN (${placeholders})`).all(...ids).map(serializeItem)
    : [];
  const byId = new Map(pieces.map((p) => [p.id, p]));
  const orderedPieces = ids.map((id) => byId.get(id)).filter(Boolean);
  const result = scoreOutfit(orderedPieces.map((p) => p.color));

  return {
    date: row.planned_date,
    pieces: orderedPieces,
    harmony: result.harmony,
    description: describeOutfit(orderedPieces, result),
  };
}

router.get("/", (req, res) => {
  const rows = db
    .prepare("SELECT * FROM planned_outfits WHERE user_id = ? ORDER BY planned_date ASC")
    .all(req.userId);
  res.json(rows.map(hydrate));
});

router.put("/:date", (req, res) => {
  const { date } = req.params;
  if (!DATE_RE.test(date)) {
    return res.status(400).json({ error: "date must be in YYYY-MM-DD format" });
  }

  const { itemIds } = req.body;
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

  const existing = db
    .prepare("SELECT id FROM planned_outfits WHERE user_id = ? AND planned_date = ?")
    .get(req.userId, date);

  if (existing) {
    db.prepare("UPDATE planned_outfits SET item_ids = ? WHERE id = ?").run(
      JSON.stringify(itemIds),
      existing.id
    );
  } else {
    db.prepare(
      "INSERT INTO planned_outfits (id, user_id, planned_date, item_ids) VALUES (?, ?, ?, ?)"
    ).run(nanoid(), req.userId, date, JSON.stringify(itemIds));
  }

  const row = db
    .prepare("SELECT * FROM planned_outfits WHERE user_id = ? AND planned_date = ?")
    .get(req.userId, date);
  res.json(hydrate(row));
});

router.delete("/:date", (req, res) => {
  const { date } = req.params;
  const row = db
    .prepare("SELECT id FROM planned_outfits WHERE user_id = ? AND planned_date = ?")
    .get(req.userId, date);
  if (!row) return res.status(404).json({ error: "not found" });

  db.prepare("DELETE FROM planned_outfits WHERE id = ?").run(row.id);
  res.status(204).end();
});

export default router;
