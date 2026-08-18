import { Router } from "express";
import db from "../db.js";
import { suggestOutfits } from "../outfits.js";
import { outfitSignature } from "../signature.js";
import { rankOutfitsWithAI } from "../aiRank.js";

const router = Router();
const RESULT_LIMIT = 3;
const AI_POOL_SIZE = 8;

router.get("/suggest", async (req, res) => {
  const { season, occasion, anchorIds, itemIds } = req.query;
  let items = db
    .prepare("SELECT * FROM items WHERE user_id = ? AND archived = 0 AND in_laundry = 0")
    .all(req.userId);

  if (itemIds) {
    const idSet = new Set(itemIds.split(",").filter(Boolean));
    items = items.filter((i) => idSet.has(i.id));
  }

  let anchorItems = [];
  if (anchorIds) {
    const ids = anchorIds.split(",").filter(Boolean).slice(0, 2);
    anchorItems = ids.map((id) => items.find((i) => i.id === id)).filter(Boolean);
    if (anchorItems.length !== ids.length) {
      return res.status(400).json({ error: "anchor item not found" });
    }
  }

  const wornRows = db.prepare("SELECT item_ids FROM worn WHERE user_id = ?").all(req.userId);
  const dislikeRows = db.prepare("SELECT item_ids FROM dislikes WHERE user_id = ?").all(req.userId);
  const excludeSignatures = new Set(
    [...wornRows, ...dislikeRows].map((row) => outfitSignature(JSON.parse(row.item_ids)))
  );

  const pool = suggestOutfits(items, {
    season,
    occasion,
    anchorItems,
    excludeSignatures,
    limit: AI_POOL_SIZE,
  });

  const aiRanked = await rankOutfitsWithAI(pool, { season, occasion, pickCount: Math.min(RESULT_LIMIT, pool.length) });
  const outfits = (aiRanked || pool).slice(0, RESULT_LIMIT);
  res.json(outfits);
});

export default router;
