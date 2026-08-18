import { COLOR_SWATCH } from "./constants.js";

const SAMPLE_SIZE = 50;
const BUCKET_STEP = 24;
const NEAR_WHITE_THRESHOLD = 250; // treat as blown-out background, not fabric

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      resolve(img);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function hexToRgb(hex) {
  const v = hex.replace("#", "");
  return {
    r: parseInt(v.slice(0, 2), 16),
    g: parseInt(v.slice(2, 4), 16),
    b: parseInt(v.slice(4, 6), 16),
  };
}

function closestColorName(r, g, b) {
  let bestName = null;
  let bestDist = Infinity;
  for (const [name, hex] of Object.entries(COLOR_SWATCH)) {
    const c = hexToRgb(hex);
    const dist = (c.r - r) ** 2 + (c.g - g) ** 2 + (c.b - b) ** 2;
    if (dist < bestDist) {
      bestDist = dist;
      bestName = name;
    }
  }
  return bestName;
}

// Samples the image onto a tiny canvas and finds the most common color
// bucket — cheap, client-side, no AI needed for a task this well-suited to
// plain pixel math. Works best on close-up product-style photos (the item
// fills most of the frame), which matches how items get added here.
export async function detectDominantColorName(file) {
  const img = await loadImage(file);
  const canvas = document.createElement("canvas");
  canvas.width = SAMPLE_SIZE;
  canvas.height = SAMPLE_SIZE;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);

  let data;
  try {
    data = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE).data;
  } catch {
    return null; // canvas got tainted (cross-origin) or similar — just skip detection
  }

  const buckets = new Map();
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
    if (a < 200) continue;
    const key = [
      Math.round(r / BUCKET_STEP),
      Math.round(g / BUCKET_STEP),
      Math.round(b / BUCKET_STEP),
    ].join(",");
    const bucket = buckets.get(key) || { count: 0, r: 0, g: 0, b: 0 };
    bucket.count++;
    bucket.r += r;
    bucket.g += g;
    bucket.b += b;
    buckets.set(key, bucket);
  }

  const sorted = [...buckets.values()]
    .map((b) => ({ count: b.count, r: b.r / b.count, g: b.g / b.count, b: b.b / b.count }))
    .sort((a, b) => b.count - a.count);

  const best = sorted.find((c) => Math.min(c.r, c.g, c.b) < NEAR_WHITE_THRESHOLD) || sorted[0];
  if (!best) return null;

  return closestColorName(best.r, best.g, best.b);
}
