import { scoreOutfit } from "./colors.js";
import { describeOutfit } from "./describe.js";
import { outfitSignature } from "./signature.js";

const MAX_PER_OPTIONAL_SLOT = 6; // cap to keep combinations fast for large closets

function matchesFilter(item, season, occasion) {
  const seasonOk = !season || season === "all" || item.season === "all" || item.season === season;
  const occasionOk = !occasion || occasion === "all" || item.occasion === "all" || item.occasion === occasion;
  return seasonOk && occasionOk;
}

// The one piece an outfit is "built around" — the dress, or else the top.
// Grouping by this (rather than by the full top+bottom pair) is what lets
// round-robin selection rotate through different tops instead of one
// high-scoring top crowding out every other option.
function anchorKey(pieces) {
  const dress = pieces.find((p) => p.category === "dress");
  if (dress) return `dress:${dress.id}`;
  const top = pieces.find((p) => p.category === "top");
  return top ? `top:${top.id}` : "other";
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

  // Drop exact duplicate piece combos (same outfit, different iteration order).
  const seen = new Set();
  const deduped = [];
  for (const r of candidates) {
    const key = r.pieces.map((p) => p.id).sort().join(",");
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(r);
  }

  // Round-robin across distinct tops/dresses instead of taking the highest
  // score overall — otherwise one top that happens to harmonize with
  // everything can crowd out every other top in the results.
  const groups = new Map();
  for (const r of deduped) {
    const key = anchorKey(r.pieces);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(r);
  }
  const orderedGroups = [...groups.values()].sort((a, b) => b[0].score - a[0].score);

  const finalResults = [];
  for (let round = 0; finalResults.length < limit; round++) {
    let addedThisRound = false;
    for (const group of orderedGroups) {
      if (round < group.length) {
        finalResults.push(group[round]);
        addedThisRound = true;
        if (finalResults.length >= limit) break;
      }
    }
    if (!addedThisRound) break;
  }

  return finalResults.map((r) => ({
    pieces: r.pieces,
    score: r.score,
    harmony: r.harmony,
    description: describeOutfit(r.pieces, r),
  }));
}
