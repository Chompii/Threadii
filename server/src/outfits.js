import { scoreOutfit } from "./colors.js";
import { describeOutfit } from "./describe.js";
import { outfitSignature } from "./signature.js";

const MAX_PER_OPTIONAL_SLOT = 6; // cap to keep combinations fast for large closets
const BASE_CATEGORIES = new Set(["top", "bottom", "dress"]);

function matchesFilter(item, season, occasion) {
  const seasonOk = !season || season === "all" || item.season === "all" || item.season === season;
  const occasionOk = !occasion || occasion === "all" || item.occasion === "all" || item.occasion === occasion;
  return seasonOk && occasionOk;
}

function baseKey(pieces) {
  return pieces
    .filter((p) => BASE_CATEGORIES.has(p.category))
    .map((p) => p.id)
    .sort()
    .join(",");
}

// anchorItems, if given (up to one per category), must each appear in every
// generated outfit — they're the "statement piece(s)" the rest of the
// outfit gets built around, rather than just one option among many.
export function suggestOutfits(
  allItems,
  { season, occasion, limit = 3, anchorItems = [], excludeSignatures } = {}
) {
  const anchorsByCategory = {};
  for (const a of anchorItems) anchorsByCategory[a.category] = a;
  const anchorIdSet = new Set(anchorItems.map((a) => a.id));

  const items = allItems.filter(
    (i) => matchesFilter(i, season, occasion) || anchorIdSet.has(i.id)
  );
  const byCategory = (cat) => items.filter((i) => i.category === cat);

  let tops = byCategory("top");
  let bottoms = byCategory("bottom");
  let dresses = byCategory("dress");
  let outerwear = byCategory("outerwear");
  let shoes = byCategory("shoes");
  let accessories = byCategory("accessory");

  // A top/bottom anchor rules out dress outfits entirely (a dress outfit
  // can't also feature a specific top or bottom), and vice versa.
  if (anchorsByCategory.top || anchorsByCategory.bottom) {
    if (anchorsByCategory.top) tops = tops.filter((t) => t.id === anchorsByCategory.top.id);
    if (anchorsByCategory.bottom) bottoms = bottoms.filter((b) => b.id === anchorsByCategory.bottom.id);
    dresses = [];
  }
  if (anchorsByCategory.dress) {
    dresses = dresses.filter((d) => d.id === anchorsByCategory.dress.id);
    tops = [];
    bottoms = [];
  }
  if (anchorsByCategory.outerwear) {
    outerwear = outerwear.filter((o) => o.id === anchorsByCategory.outerwear.id);
  }
  if (anchorsByCategory.shoes) {
    shoes = shoes.filter((s) => s.id === anchorsByCategory.shoes.id);
  }
  if (anchorsByCategory.accessory) {
    accessories = accessories.filter((a) => a.id === anchorsByCategory.accessory.id);
  }

  outerwear = outerwear.slice(0, MAX_PER_OPTIONAL_SLOT);
  shoes = shoes.slice(0, MAX_PER_OPTIONAL_SLOT);
  accessories = accessories.slice(0, MAX_PER_OPTIONAL_SLOT);

  const bases = [];
  for (const d of dresses) bases.push([d]);
  for (const t of tops) {
    for (const b of bottoms) bases.push([t, b]);
  }

  // An optional slot stays optional (can be skipped) unless an anchor lives
  // in it, in which case it's required in every combo.
  const optionalSlot = (list, category) => (anchorsByCategory[category] ? list : [null, ...list]);

  const optionalSlots = [
    optionalSlot(outerwear, "outerwear"),
    optionalSlot(shoes, "shoes"),
    optionalSlot(accessories, "accessory"),
  ];

  const results = [];
  for (const base of bases) {
    for (const o of optionalSlots[0]) {
      for (const s of optionalSlots[1]) {
        for (const a of optionalSlots[2]) {
          const pieces = [...base, o, s, a].filter(Boolean);
          const colors = pieces.map((p) => p.color);
          const { score, harmony, pair } = scoreOutfit(colors);
          results.push({ pieces, score, harmony, pair });
        }
      }
    }
  }

  // Drop any combo that's already been marked as worn, or disliked — it
  // won't be suggested again until it's unmarked.
  const candidates =
    excludeSignatures && excludeSignatures.size > 0
      ? results.filter((r) => !excludeSignatures.has(outfitSignature(r.pieces.map((p) => p.id))))
      : results;

  candidates.sort((a, b) => b.score - a.score);

  // Pick the top outfits while preferring a different top/bottom (or dress)
  // combo each time, so "top 3" isn't the same base outfit with 3 different
  // pairs of shoes.
  const seen = new Set();
  const usedBases = new Set();
  const primary = [];
  const overflow = [];

  for (const r of candidates) {
    const key = r.pieces.map((p) => p.id).sort().join(",");
    if (seen.has(key)) continue;
    seen.add(key);

    const base = baseKey(r.pieces);
    if (usedBases.has(base)) {
      overflow.push(r);
    } else {
      usedBases.add(base);
      primary.push(r);
    }
    if (primary.length >= limit) break;
  }

  const finalResults = primary.length >= limit ? primary : [...primary, ...overflow].slice(0, limit);

  return finalResults.map((r) => ({
    pieces: r.pieces,
    score: r.score,
    harmony: r.harmony,
    description: describeOutfit(r.pieces, r),
  }));
}
