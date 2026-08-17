import { Router } from "express";
import db from "../db.js";
import { serializeItem } from "../tags.js";

const router = Router();

router.get("/", (req, res) => {
  const items = db
    .prepare("SELECT * FROM items WHERE user_id = ?")
    .all(req.userId)
    .map(serializeItem);

  const favorites = db
    .prepare("SELECT * FROM favorites WHERE user_id = ?")
    .all(req.userId)
    .map((row) => ({ ...row, item_ids: JSON.parse(row.item_ids) }));

  const worn = db
    .prepare("SELECT * FROM worn WHERE user_id = ?")
    .all(req.userId)
    .map((row) => ({ ...row, item_ids: JSON.parse(row.item_ids) }));

  res.setHeader("Content-Disposition", 'attachment; filename="threadii-export.json"');
  res.json({
    exportedAt: new Date().toISOString(),
    items,
    favorites,
    worn,
  });
});

export default router;
