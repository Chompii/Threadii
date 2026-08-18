import { scoreOutfit } from "./colors.js";
import { describeOutfit } from "./describe.js";
import { outfitSignature } from "./signature.js";
import { fitBalanceBonus } from "./fit.js";
import { styleProfileBonus } from "./style.js";

const MAX_PER_OPTIONAL_SLOT = 6; // cap to keep combinations fast for large closets

function matchesFilter(item, season, occasion) {
  const seasonOk = !season || season === "all" || item.season === "all" || item.season === season;
  const occasionOk = !occasion || occasion === "all" || item.occasion === "all" || item.occasion === occasion;
  return seasonOk && occasionOk;
}

function pieceId(pieces, category) {
  return pieces.find((p) => p.category === category)?.id ?? null;
}

// Greedily builds a diverse top-N: at each step, picks the highest-scoring
// remaining candidate among those least reused so far (by top, bottom, and
// dress), so a single piece that happens to harmonize with everything can't
// crowd out every other option — this balances variety across both the top
// AND the bottom, not just one or the other.
function selectDiverse(sortedCandidates, limit) {
  const usage = { top: new Map(), bottom: new Map(), dress: new Map() };
  const remaining = [...sortedCandidates];
  const picked = [];

  while (picked.length < limit && remaining.length > 0) {
    let bestIdx = 0;
    let bestPenalty = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const pieces = remaining[i].pieces;
      const penalty =
        (usage.top.get(pieceId(pieces, "top")) || 0) +
        (usage.bottom.get(pieceId(pieces, "bottom")) || 0) +
        (usage.dress.get(pieceId(pieces, "dress")) || 0);
      if (penalty < bestPenalty) {
        bestPenalty = penalty;
        bestIdx = i;
        if (penalty === 0) break; // candidates are pre-sorted by score; first zero-penalty wins
      }
    }
    const [chosen] = remaining.splice(bestIdx, 1);
    picked.push(chosen);
    for (const category of ["top", "bottom", "dress"]) {
      const id = pieceId(chosen.pieces, category);
      if (id) usage[category].set(id, (usage[category].get(id) || 0) + 1);
    }
  }
  return picked;
}

// anchorItems, if given (up to one per category), must each appear in every
// generated outfit — they're the "statement piece(s)" the rest of the
// outfit gets built around, rather than just one option among many.
export function suggestOutfits(
  allItems,
  { season, occasion, limit = 3, anchorItems = [], excludeSignatures, styleProfile = null } = {}
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

  outerwear = outerwear.slice(0, MAX_PER_OPTIONAL_SLOT);

  const bases = [];
  for (const d of dresses) bases.push([d]);
  for (const t of tops) {
    for (const b of bottoms) bases.push([t, b]);
  }

  // Outerwear stays optional (not every outfit needs a jacket) unless
  // anchored. Shoes are never optional — a real outfit always has shoes —
  // so rather than treating them as another combinatorial branch (which
  // just multiplies near-duplicate outfits), the single best-matching pair
  // is picked deterministically per base+outerwear combo.
  const outerwearOptions = anchorsByCategory.outerwear ? outerwear : [null, ...outerwear];

  const results = [];
  for (const base of bases) {
    for (const o of outerwearOptions) {
      const partial = [...base, o].filter(Boolean);

      let shoeChoice = null;
      if (shoes.length > 0) {
        let bestScore = -Infinity;
        for (const s of shoes) {
          const { score } = scoreOutfit([...partial.map((p) => p.color), s.color]);
          if (score > bestScore) {
            bestScore = score;
            shoeChoice = s;
          }
        }
      }

      const pieces = [...partial, shoeChoice].filter(Boolean);
      const colors = pieces.map((p) => p.color);
      const { score, harmony, pair } = scoreOutfit(colors);
      // Fit-balance and style-profile nudges bias which outfits rank higher
      // without touching the color-only harmony label shown to the user.
      const bonus = fitBalanceBonus(pieces) + styleProfileBonus(pieces, harmony, styleProfile);
      results.push({ pieces, score: score + bonus, harmony, pair });
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

  const finalResults = selectDiverse(deduped, limit);

  return finalResults.map((r) => ({
    pieces: r.pieces,
    score: r.score,
    harmony: r.harmony,
    description: describeOutfit(r.pieces, r),
  }));
}
