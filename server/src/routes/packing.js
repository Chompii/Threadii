import { Router } from "express";
import { nanoid } from "nanoid";
import db from "../db.js";
import { serializeItem } from "../tags.js";

const router = Router();

function hydrate(row) {
  const ids = JSON.parse(row.item_ids);
  const placeholders = ids.map(() => "?").join(",");
  const items = ids.length
    ? db.prepare(`SELECT * FROM items WHERE id IN (${placeholders})`).all(...ids).map(serializeItem)
    : [];
  const byId = new Map(items.map((i) => [i.id, i]));
  const orderedItems = ids.map((id) => byId.get(id)).filter(Boolean);

  return {
    id: row.id,
    name: row.name,
    items: orderedItems,
    created_at: row.created_at,
  };
}

router.get("/", (req, res) => {
  const rows = db
    .prepare("SELECT * FROM packing_lists WHERE user_id = ? ORDER BY created_at DESC")
    .all(req.userId);
  res.json(rows.map(hydrate));
});

router.post("/", (req, res) => {
  const { name, itemIds } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "name is required" });
  }
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
  db.prepare("INSERT INTO packing_lists (id, user_id, name, item_ids) VALUES (?, ?, ?, ?)").run(
    id,
    req.userId,
    name.trim(),
    JSON.stringify(itemIds)
  );

  const row = db.prepare("SELECT * FROM packing_lists WHERE id = ?").get(id);
  res.status(201).json(hydrate(row));
});

router.patch("/:id", (req, res) => {
  const row = db
    .prepare("SELECT * FROM packing_lists WHERE id = ? AND user_id = ?")
    .get(req.params.id, req.userId);
  if (!row) return res.status(404).json({ error: "not found" });

  const { name, itemIds } = req.body;

  if (name !== undefined) {
    if (!name.trim()) return res.status(400).json({ error: "name cannot be empty" });
    db.prepare("UPDATE packing_lists SET name = ? WHERE id = ?").run(name.trim(), req.params.id);
  }

  if (itemIds !== undefined) {
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
    db.prepare("UPDATE packing_lists SET item_ids = ? WHERE id = ?").run(
      JSON.stringify(itemIds),
      req.params.id
    );
  }

  const updated = db.prepare("SELECT * FROM packing_lists WHERE id = ?").get(req.params.id);
  res.json(hydrate(updated));
});

router.delete("/:id", (req, res) => {
  const row = db
    .prepare("SELECT id FROM packing_lists WHERE id = ? AND user_id = ?")
    .get(req.params.id, req.userId);
  if (!row) return res.status(404).json({ error: "not found" });

  db.prepare("DELETE FROM packing_lists WHERE id = ?").run(req.params.id);
  res.status(204).end();
});

export default router;
