import { Router } from "express";
import db from "../db.js";
import { suggestOutfits } from "../outfits.js";
import { outfitSignature } from "../signature.js";
import { rankOutfitsWithAI } from "../aiRank.js";
import { scoreOutfit, toMatchPercent } from "../colors.js";
import { serializeItem } from "../tags.js";
import { buildStyleProfile } from "../style.js";

const router = Router();
const DEFAULT_LIMIT = 3;
const AI_POOL_SIZE = 8;
const MAX_LIMIT = 25;

function loadStyleProfile(userId) {
  const rows = db.prepare("SELECT item_ids FROM style_picks WHERE user_id = ?").all(userId);
  if (rows.length === 0) return null;
  const picks = rows.map((row) => {
    const ids = JSON.parse(row.item_ids);
    const placeholders = ids.map(() => "?").join(",");
    const items = ids.length
      ? db.prepare(`SELECT * FROM items WHERE id IN (${placeholders})`).all(...ids)
      : [];
    return { items };
  });
  return buildStyleProfile(picks);
}

function loadInspirationDescriptors(userId) {
  const rows = db
    .prepare("SELECT descriptor FROM inspiration_images WHERE user_id = ? AND descriptor IS NOT NULL")
    .all(userId);
  return rows.map((r) => r.descriptor).filter(Boolean);
}

router.get("/suggest", async (req, res) => {
  const { season, occasion, anchorIds, itemIds, count } = req.query;
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(count, 10) || DEFAULT_LIMIT));
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

  const styleProfile = loadStyleProfile(req.userId);
  const inspirationDescriptors = loadInspirationDescriptors(req.userId);

  // Small requests (the default "top 3") go through the AI re-ranking pass.
  // Larger requests ("Show more") skip it and return a purely rule-based,
  // round-robin-diverse list instead — ranking/describing 20+ candidates
  // with Gemini would be slow and isn't worth the API quota at that size.
  if (limit <= DEFAULT_LIMIT) {
    const pool = suggestOutfits(items, {
      season,
      occasion,
      anchorItems,
      excludeSignatures,
      styleProfile,
      limit: AI_POOL_SIZE,
    });
    const aiRanked = await rankOutfitsWithAI(pool, {
      season,
      occasion,
      pickCount: Math.min(limit, pool.length),
      styleDescriptor: styleProfile?.descriptor,
      inspirationDescriptors,
    });
    return res.json((aiRanked || pool).slice(0, limit));
  }

  const outfits = suggestOutfits(items, {
    season,
    occasion,
    anchorItems,
    excludeSignatures,
    styleProfile,
    limit,
  });
  res.json(outfits);
});

const MAX_ACCESSORY_SUGGESTIONS = 6;
const MAX_SHOE_SUGGESTIONS = 8;

// Accessories are deliberately left out of the combinatorial outfit
// generation (they used to multiply near-duplicate outfits — same top+bottom
// repeated once per accessory). Instead they're offered here, on demand, for
// a specific already-chosen outfit, each with a 0-100 match score.
router.get("/accessories", (req, res) => {
  const { itemIds } = req.query;
  const ids = (itemIds || "").split(",").filter(Boolean);
  if (ids.length === 0) return res.json([]);

  const pieces = ids
    .map((id) => db.prepare("SELECT * FROM items WHERE id = ? AND user_id = ?").get(id, req.userId))
    .filter(Boolean);
  if (pieces.length === 0) return res.json([]);

  const usedIds = new Set(pieces.map((p) => p.id));
  const accessories = db
    .prepare("SELECT * FROM items WHERE user_id = ? AND category = 'accessory' AND archived = 0 AND in_laundry = 0")
    .all(req.userId)
    .filter((a) => !usedIds.has(a.id));

  const baseColors = pieces.map((p) => p.color);
  const ranked = accessories
    .map((a) => {
      const { score, harmony } = scoreOutfit([...baseColors, a.color]);
      return { ...serializeItem(a), harmony, matchPercent: toMatchPercent(score) };
    })
    .filter((a) => a.harmony !== "clashing")
    .sort((a, b) => b.matchPercent - a.matchPercent)
    .slice(0, MAX_ACCESSORY_SUGGESTIONS);

  res.json(ranked);
});

// Every generated outfit already includes the single best-matching shoe
// (see outfits.js), but the detail view offers the full ranked list so the
// user can see the score and swap to a different pair from their closet.
router.get("/shoes", (req, res) => {
  const { itemIds } = req.query;
  const ids = (itemIds || "").split(",").filter(Boolean);
  if (ids.length === 0) return res.json([]);

  const pieces = ids
    .map((id) => db.prepare("SELECT * FROM items WHERE id = ? AND user_id = ?").get(id, req.userId))
    .filter(Boolean);
  if (pieces.length === 0) return res.json([]);

  const shoes = db
    .prepare("SELECT * FROM items WHERE user_id = ? AND category = 'shoes' AND archived = 0 AND in_laundry = 0")
    .all(req.userId);

  const baseColors = pieces.map((p) => p.color);
  const ranked = shoes
    .map((s) => {
      const { score, harmony } = scoreOutfit([...baseColors, s.color]);
      return { ...serializeItem(s), harmony, matchPercent: toMatchPercent(score) };
    })
    .sort((a, b) => b.matchPercent - a.matchPercent)
    .slice(0, MAX_SHOE_SUGGESTIONS);

  res.json(ranked);
});

export default router;
