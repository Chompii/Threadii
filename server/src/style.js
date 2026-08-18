import { NEUTRALS, scoreOutfit } from "./colors.js";

// Turns up to 5 "outfits I love" (each a real set of the user's own closet
// items) into a compact style profile: what harmony types they gravitate
// toward, how neutral-heavy their taste runs, and whether they tend to
// layer or accessorize. Used to nudge suggestion scoring/ranking toward
// what this specific person actually likes, not just generically valid.
export function buildStyleProfile(picks) {
  if (!picks || picks.length === 0) return null;

  const harmonyCounts = {};
  let neutralPieces = 0;
  let totalPieces = 0;
  let outerwearCount = 0;
  let accessoryCount = 0;
  let colorCountSum = 0;

  for (const pick of picks) {
    const colors = pick.items.map((i) => i.color);
    const { harmony } = scoreOutfit(colors);
    harmonyCounts[harmony] = (harmonyCounts[harmony] || 0) + 1;

    colorCountSum += new Set(colors).size;
    for (const item of pick.items) {
      totalPieces++;
      if (NEUTRALS.has(item.color)) neutralPieces++;
      if (item.category === "outerwear") outerwearCount++;
      if (item.category === "accessory") accessoryCount++;
    }
  }

  const dominantHarmony = Object.entries(harmonyCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  const neutralRatio = totalPieces > 0 ? neutralPieces / totalPieces : 0;
  const avgColorCount = colorCountSum / picks.length;
  const layersOften = outerwearCount / picks.length >= 0.4;
  const accessorizesOften = accessoryCount / picks.length >= 0.4;

  const descriptorParts = [];
  if (dominantHarmony) descriptorParts.push(`leans toward ${dominantHarmony} color pairing`);
  descriptorParts.push(neutralRatio >= 0.6 ? "sticks mostly to neutrals" : "isn't afraid of color");
  if (layersOften) descriptorParts.push("often layers outerwear");
  if (accessorizesOften) descriptorParts.push("likes to accessorize");

  return {
    dominantHarmony,
    neutralRatio,
    avgColorCount,
    layersOften,
    accessorizesOften,
    descriptor: `This person's style ${descriptorParts.join(", ")}.`,
  };
}

const HARMONY_MATCH_BONUS = 0.3;
const LAYER_BONUS = 0.2;
const ACCESSORY_BONUS = 0.15;

// Small, deliberately modest nudge toward a candidate outfit's fit with the
// user's derived style profile — this should bias ranking, not override the
// underlying color-harmony/fit-balance scoring.
export function styleProfileBonus(pieces, harmony, profile) {
  if (!profile) return 0;
  let bonus = 0;
  if (profile.dominantHarmony && harmony === profile.dominantHarmony) bonus += HARMONY_MATCH_BONUS;
  if (profile.layersOften && pieces.some((p) => p.category === "outerwear")) bonus += LAYER_BONUS;
  if (profile.accessorizesOften && pieces.some((p) => p.category === "accessory")) bonus += ACCESSORY_BONUS;
  return bonus;
}
