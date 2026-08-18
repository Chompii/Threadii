const MODEL = "gemini-3.6-flash";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const TIMEOUT_MS = 12000;

function describePiece(p) {
  return `${p.color} ${p.name} (${p.category})`;
}

function buildPrompt(candidates, { season, occasion, pickCount }) {
  const lines = candidates.map((c, i) => `${i}: ${c.pieces.map(describePiece).join(", ")}`);
  const context = [
    season && season !== "all" ? `season: ${season}` : null,
    occasion && occasion !== "all" ? `occasion: ${occasion}` : null,
  ]
    .filter(Boolean)
    .join(", ");

  return `You are a fashion stylist. Below are ${candidates.length} candidate outfits pulled from someone's closet — they're already color-coordinated, so don't just judge whether colors technically match. Pick the ${pickCount} that would genuinely look the best and give the wearer the most confidence${context ? ` for ${context}` : ""}, ranked best first. For each pick, write one punchy, specific, encouraging sentence (max 20 words) on why it looks great.

Candidates:
${lines.join("\n")}

Respond as JSON: {"picks": [{"index": <candidate number>, "reason": "<sentence>"}]}, exactly ${pickCount} picks, best first, each index used once.`;
}

// Sends the rule-based candidate pool to Gemini to re-rank by subjective
// "looks great" quality and write punchier reasons — the rule-based scoring
// still guarantees every candidate is a structurally valid, color-coordinated
// outfit; this only reorders/relabels them. Returns null on any failure so
// the caller can fall back to the plain rule-based ranking.
export async function rankOutfitsWithAI(candidates, { season, occasion, pickCount = 3 } = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || candidates.length === 0) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(candidates, { season, occasion, pickCount }) }] }],
        generationConfig: { responseMimeType: "application/json" },
      }),
      signal: controller.signal,
    });
    if (!response.ok) return null;

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed.picks)) return null;

    const seen = new Set();
    const ranked = [];
    for (const pick of parsed.picks) {
      const idx = pick.index;
      if (typeof idx !== "number" || idx < 0 || idx >= candidates.length || seen.has(idx)) continue;
      seen.add(idx);
      const reason = typeof pick.reason === "string" ? pick.reason.trim() : "";
      ranked.push({
        ...candidates[idx],
        description: reason || candidates[idx].description,
      });
    }
    return ranked.length > 0 ? ranked : null;
  } catch {
    return null; // network error, timeout, bad JSON, rate limit — just fall back
  } finally {
    clearTimeout(timer);
  }
}
