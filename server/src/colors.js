// Fashion-neutral colors: treated as "goes with anything" even though some
// (navy, brown, denim) aren't technically desaturated.
export const NEUTRALS = new Set([
  "black",
  "white",
  "gray",
  "navy",
  "beige",
  "brown",
  "denim",
  "cream",
]);

// Approximate hue (degrees, 0-360 on the color wheel) for each non-neutral color.
// Used to reason about analogous/complementary/triadic relationships instead of
// a hand-picked list of "good pairs".
const HUE = {
  red: 0,
  orange: 28,
  yellow: 50,
  green: 130,
  blue: 215,
  purple: 275,
  pink: 330,
};

function hueDistance(h1, h2) {
  const d = Math.abs(h1 - h2) % 360;
  return d > 180 ? 360 - d : d;
}

// Score + a human-readable reason for a pair of non-neutral colors, based on
// where they sit relative to each other on the color wheel.
function nonNeutralPairScore(colorA, colorB) {
  const dist = hueDistance(HUE[colorA], HUE[colorB]);

  if (dist <= 20) return { score: 2.5, harmony: "analogous" };
  if (dist >= 150) return { score: 2.5, harmony: "complementary" };
  if (dist >= 100) return { score: 1.5, harmony: "triadic" };
  if (dist >= 60) return { score: 0.5, harmony: "clashing" };
  return { score: 1, harmony: "adjacent" };
}

function pairScore(colorA, colorB) {
  if (colorA === colorB) return { score: 3, harmony: "tonal" };
  const aNeutral = NEUTRALS.has(colorA);
  const bNeutral = NEUTRALS.has(colorB);
  if (aNeutral && bNeutral) return { score: 3, harmony: "neutral" };
  if (aNeutral || bNeutral) return { score: 3, harmony: "neutral" };
  return nonNeutralPairScore(colorA, colorB);
}

// Score a whole outfit (array of color strings): average pairwise score, plus
// the "worst" (lowest-scoring) relationship as the overall harmony label —
// that pair is also what gets referenced when explaining the outfit.
export function scoreOutfit(colors) {
  const unique = colors.filter(Boolean);
  if (unique.length <= 1) return { score: 3, harmony: "tonal", pair: unique };

  let total = 0;
  let pairs = 0;
  let worst = null;

  for (let i = 0; i < unique.length; i++) {
    for (let j = i + 1; j < unique.length; j++) {
      const result = pairScore(unique[i], unique[j]);
      total += result.score;
      pairs++;
      if (!worst || result.score < worst.score) {
        worst = { ...result, pair: [unique[i], unique[j]] };
      }
    }
  }

  if (pairs === 0) return { score: 3, harmony: "tonal", pair: unique };
  return { score: total / pairs, harmony: worst.harmony, pair: worst.pair };
}

// Converts a raw pairwise color score (roughly 0.5-3) to a 0-100 "match"
// percentage for display — used for accessory/shoe suggestions so the user
// sees a concrete number instead of just a sorted list.
export function toMatchPercent(score) {
  return Math.round(Math.max(0, Math.min(1, score / 3)) * 100);
}
