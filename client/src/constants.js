export const CATEGORIES = ["top", "bottom", "dress", "outerwear", "shoes", "accessory"];

export const COLORS = [
  "black",
  "white",
  "gray",
  "navy",
  "beige",
  "brown",
  "denim",
  "cream",
  "red",
  "blue",
  "green",
  "yellow",
  "pink",
  "purple",
  "orange",
];

export const SEASONS = ["all", "spring", "summer", "fall", "winter"];
export const OCCASIONS = ["casual", "formal", "sport", "all"];
export const FITS = ["fitted", "regular", "relaxed"];

// Mirrors server/src/colors.js NEUTRALS — "goes with anything" colors, used
// client-side for the closet's neutral-base gap check.
export const NEUTRAL_COLORS = new Set(["black", "white", "gray", "navy", "beige", "brown", "denim", "cream"]);

export const COLOR_SWATCH = {
  black: "#1c1917",
  white: "#ffffff",
  gray: "#9ca3af",
  navy: "#1e293b",
  beige: "#e8dcc8",
  brown: "#8b5e34",
  denim: "#4a6b8a",
  cream: "#f5ecd9",
  red: "#dc2626",
  blue: "#2563eb",
  green: "#16a34a",
  yellow: "#eab308",
  pink: "#ec4899",
  purple: "#9333ea",
  orange: "#f97316",
};
