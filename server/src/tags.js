const MAX_TAGS = 10;
const MAX_TAG_LENGTH = 24;

export function parseTags(raw) {
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

// Accepts an array or a JSON-string-encoded array (multipart form fields
// arrive as strings), trims/lowercases/dedupes, and caps count + length.
export function sanitizeTags(input) {
  let arr = input;
  if (typeof input === "string") {
    try {
      arr = JSON.parse(input);
    } catch {
      arr = [];
    }
  }
  if (!Array.isArray(arr)) arr = [];

  const seen = new Set();
  const clean = [];
  for (const t of arr) {
    if (typeof t !== "string") continue;
    const trimmed = t.trim().toLowerCase().slice(0, MAX_TAG_LENGTH);
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    clean.push(trimmed);
    if (clean.length >= MAX_TAGS) break;
  }
  return clean;
}

export function serializeItem(row) {
  return {
    ...row,
    tags: parseTags(row.tags),
    in_laundry: Boolean(row.in_laundry),
    archived: Boolean(row.archived),
  };
}
