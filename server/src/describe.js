import { NEUTRALS } from "./colors.js";

function cap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const HARMONY_SENTENCE = {
  tonal: ([a]) => `${cap(a)} repeated across the outfit keeps it tonal and effortless — nothing to second-guess.`,
  neutral: ([a, b]) => {
    const [neutral, pop] = NEUTRALS.has(a) ? [a, b] : [b, a];
    return NEUTRALS.has(pop)
      ? `${cap(neutral)} and ${pop} are both neutrals, so this is about as safe a pairing as it gets.`
      : `${cap(neutral)} is a neutral, so it quietly grounds the outfit while ${pop} gets to stand out.`;
  },
  analogous: ([a, b]) => `${cap(a)} and ${b} sit right next to each other on the color wheel, so they blend smoothly without any effort.`,
  complementary: ([a, b]) => `${cap(a)} and ${b} sit opposite each other on the color wheel — a bold, high-contrast pairing that still looks intentional.`,
  triadic: ([a, b]) => `${cap(a)} and ${b} are spaced evenly apart on the color wheel, giving this outfit more energy than a safe pairing.`,
  adjacent: ([a, b]) => `${cap(a)} and ${b} are close but don't quite match — a subtle, slightly unexpected pairing.`,
  clashing: ([a, b]) => `${cap(a)} and ${b} are close enough to compete without blending — bold if you commit to it, or swap one piece for a neutral if you'd rather play it safe.`,
};

export function describeOutfit(pieces, { harmony, pair }) {
  if (pieces.length === 1) {
    const [p] = pieces;
    return `A one-piece look — the ${p.color} ${p.name.toLowerCase()} does all the work, no matching required.`;
  }

  const sentenceFn = HARMONY_SENTENCE[harmony] || HARMONY_SENTENCE.analogous;
  let sentence = sentenceFn(pair);

  const occasions = new Set(pieces.map((p) => p.occasion).filter((o) => o && o !== "all"));
  const seasons = new Set(pieces.map((p) => p.season).filter((s) => s && s !== "all"));

  if (occasions.size === 1) {
    sentence += ` Fits a ${[...occasions][0]} occasion.`;
  }
  if (seasons.size === 1) {
    sentence += ` Built for ${[...seasons][0]}.`;
  }

  return sentence;
}
