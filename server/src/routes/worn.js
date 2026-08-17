import { Router } from "express";
import { nanoid } from "nanoid";
import db from "../db.js";

const router = Router();

router.get("/", (req, res) => {
  const rows = db
    .prepare("SELECT * FROM worn WHERE user_id = ? ORDER BY worn_at DESC")
    .all(req.userId);
  res.json(
    rows.map((row) => ({
      id: row.id,
      itemIds: JSON.parse(row.item_ids),
      wornAt: row.worn_at,
    }))
  );
});

router.post("/", (req, res) => {
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

  const id = nanoid();
  db.prepare("INSERT INTO worn (id, user_id, item_ids) VALUES (?, ?, ?)").run(
    id,
    req.userId,
    JSON.stringify(itemIds)
  );

  const row = db.prepare("SELECT * FROM worn WHERE id = ?").get(id);
  res.status(201).json({ id: row.id, itemIds: JSON.parse(row.item_ids), wornAt: row.worn_at });
});

router.delete("/:id", (req, res) => {
  const row = db
    .prepare("SELECT * FROM worn WHERE id = ? AND user_id = ?")
    .get(req.params.id, req.userId);
  if (!row) return res.status(404).json({ error: "not found" });

  db.prepare("DELETE FROM worn WHERE id = ?").run(req.params.id);
  res.status(204).end();
});

export default router;
