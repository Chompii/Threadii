import { Router } from "express";
import { nanoid } from "nanoid";
import db from "../db.js";
import { serializeItem } from "../tags.js";
import { buildStyleProfile } from "../style.js";

const MAX_PICKS = 5;
const MIN_PIECES = 2;
const MAX_PIECES = 6;

const router = Router();

function hydrate(row) {
  const ids = JSON.parse(row.item_ids);
  const placeholders = ids.map(() => "?").join(",");
  const items = ids.length
    ? db.prepare(`SELECT * FROM items WHERE id IN (${placeholders})`).all(...ids).map(serializeItem)
    : [];
  const byId = new Map(items.map((i) => [i.id, i]));
  const orderedItems = ids.map((id) => byId.get(id)).filter(Boolean);
  return { id: row.id, items: orderedItems, created_at: row.created_at };
}

router.get("/", (req, res) => {
  const rows = db
    .prepare("SELECT * FROM style_picks WHERE user_id = ? ORDER BY created_at ASC")
    .all(req.userId);
  const picks = rows.map(hydrate);
  res.json({ picks, profile: buildStyleProfile(picks) });
});

router.post("/", (req, res) => {
  const { itemIds } = req.body;
  if (!Array.isArray(itemIds) || itemIds.length < MIN_PIECES || itemIds.length > MAX_PIECES) {
    return res.status(400).json({ error: `pick between ${MIN_PIECES} and ${MAX_PIECES} items` });
  }

  const count = db
    .prepare("SELECT COUNT(*) as n FROM style_picks WHERE user_id = ?")
    .get(req.userId).n;
  if (count >= MAX_PICKS) {
    return res.status(400).json({ error: `you can save up to ${MAX_PICKS} looks — remove one first` });
  }

  const placeholders = itemIds.map(() => "?").join(",");
  const found = db
    .prepare(`SELECT id FROM items WHERE id IN (${placeholders}) AND user_id = ?`)
    .all(...itemIds, req.userId);
  if (found.length !== itemIds.length) {
    return res.status(400).json({ error: "one or more items not found" });
  }

  const id = nanoid();
  db.prepare("INSERT INTO style_picks (id, user_id, item_ids) VALUES (?, ?, ?)").run(
    id,
    req.userId,
    JSON.stringify(itemIds)
  );

  const row = db.prepare("SELECT * FROM style_picks WHERE id = ?").get(id);
  res.status(201).json(hydrate(row));
});

router.delete("/:id", (req, res) => {
  const row = db
    .prepare("SELECT id FROM style_picks WHERE id = ? AND user_id = ?")
    .get(req.params.id, req.userId);
  if (!row) return res.status(404).json({ error: "not found" });

  db.prepare("DELETE FROM style_picks WHERE id = ?").run(req.params.id);
  res.status(204).end();
});

export default router;
