// Mirrors the harmony labels the backend derives from hue-distance math
// (server/src/colors.js) so the badge text explains *why* an outfit scored
// the way it did, not just a generic tier.
const LABELS = {
  tonal: { text: "Tonal", tone: "bg-emerald-100 text-emerald-700" },
  neutral: { text: "Neutral & safe", tone: "bg-emerald-100 text-emerald-700" },
  analogous: { text: "Analogous", tone: "bg-emerald-100 text-emerald-700" },
  complementary: { text: "Complementary", tone: "bg-emerald-100 text-emerald-700" },
  triadic: { text: "Triadic", tone: "bg-amber-100 text-amber-700" },
  adjacent: { text: "Adjacent hues", tone: "bg-amber-100 text-amber-700" },
  clashing: { text: "Bold clash", tone: "bg-rose-100 text-rose-700" },
};

export function harmonyLabel(harmony) {
  return LABELS[harmony] || { text: "Combo", tone: "bg-stone-100 text-stone-700" };
}
