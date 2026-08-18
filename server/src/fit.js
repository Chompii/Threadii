// Proportion balance: the one rule that shows up across styling guides
// regardless of body type is to keep one area of an outfit loose and one
// fitted — two oversized pieces read as sloppy, two fitted pieces read as
// stiff. This nudges scoring toward that balance without needing any body
// data, just an optional per-item "fit" tag (fitted / regular / relaxed).
const BALANCE_BONUS = 0.4;
const IMBALANCE_PENALTY = 0.25;

export function fitBalanceBonus(pieces) {
  const top = pieces.find((p) => p.category === "top");
  const bottom = pieces.find((p) => p.category === "bottom");
  if (!top || !bottom) return 0; // dress outfits have nothing to balance against

  const a = top.fit || "regular";
  const b = bottom.fit || "regular";
  if (a === "regular" || b === "regular") return 0;
  if (a === b) return -IMBALANCE_PENALTY; // both fitted or both relaxed
  return BALANCE_BONUS; // one fitted, one relaxed
}
