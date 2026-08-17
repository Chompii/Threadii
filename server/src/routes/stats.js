import { Router } from "express";
import db from "../db.js";
import { serializeItem } from "../tags.js";

const router = Router();
const STALE_DAYS = 60;

function daysSince(dateStr) {
  const iso = dateStr.includes("T") ? dateStr : dateStr.replace(" ", "T") + "Z";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return 0;
  return Math.floor((Date.now() - then) / (1000 * 60 * 60 * 24));
}

router.get("/", (req, res) => {
  const items = db
    .prepare("SELECT * FROM items WHERE user_id = ? AND archived = 0")
    .all(req.userId)
    .map(serializeItem);

  const wornRows = db.prepare("SELECT item_ids, worn_at FROM worn WHERE user_id = ?").all(req.userId);

  // itemId -> { count, lastWornAt }
  const wearInfo = new Map();
  for (const row of wornRows) {
    const ids = JSON.parse(row.item_ids);
    for (const id of ids) {
      const existing = wearInfo.get(id) || { count: 0, lastWornAt: null };
      existing.count += 1;
      if (!existing.lastWornAt || row.worn_at > existing.lastWornAt) {
        existing.lastWornAt = row.worn_at;
      }
      wearInfo.set(id, existing);
    }
  }

  const enriched = items.map((item) => {
    const info = wearInfo.get(item.id) || { count: 0, lastWornAt: null };
    const referenceDate = info.lastWornAt || item.created_at;
    return {
      item,
      wearCount: info.count,
      lastWornAt: info.lastWornAt,
      daysSinceWorn: daysSince(referenceDate),
    };
  });

  const mostWorn = [...enriched]
    .filter((e) => e.wearCount > 0)
    .sort((a, b) => b.wearCount - a.wearCount)
    .slice(0, 5)
    .map((e) => ({ item: e.item, wearCount: e.wearCount, lastWornAt: e.lastWornAt }));

  const staleItems = [...enriched]
    .filter((e) => e.daysSinceWorn >= STALE_DAYS)
    .sort((a, b) => b.daysSinceWorn - a.daysSinceWorn)
    .slice(0, 10)
    .map((e) => ({ item: e.item, daysSinceWorn: e.daysSinceWorn, everWorn: Boolean(e.lastWornAt) }));

  res.json({
    totalItems: items.length,
    neverWornCount: enriched.filter((e) => e.wearCount === 0).length,
    mostWorn,
    staleItems,
  });
});

export default router;
