const MODEL = "gemini-3.6-flash";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const TIMEOUT_MS = 12000;

function describePiece(p) {
  return `${p.color} ${p.name} (${p.category})`;
}

function buildPrompt(candidates, { season, occasion, pickCount, styleDescriptor, inspirationDescriptors }) {
  const lines = candidates.map((c, i) => `${i}: ${c.pieces.map(describePiece).join(", ")}`);
  const context = [
    season && season !== "all" ? `season: ${season}` : null,
    occasion && occasion !== "all" ? `occasion: ${occasion}` : null,
  ]
    .filter(Boolean)
    .join(", ");

  const preferenceLines = [];
  if (styleDescriptor) {
    preferenceLines.push(`- Their own taste, from outfits they've told us they love: ${styleDescriptor}`);
  }
  if (inspirationDescriptors && inspirationDescriptors.length > 0) {
    preferenceLines.push(
      `- Reference looks they've uploaded as "the vibe I want": ${inspirationDescriptors.join(" / ")}`
    );
  }

  return `You are a fashion stylist. Below are ${candidates.length} candidate outfits pulled from someone's closet — they're already color-coordinated, so don't just judge whether colors technically match. Every candidate already includes shoes, and some include a layered outerwear piece.

Judge each candidate the way a good stylist would:
- Color cohesion: reward a tight, intentional palette (ideally 3 colors or fewer across the whole outfit) over a busy one.
- Cohesion of formality: the shoes and outerwear should suit the same occasion as the rest of the outfit — casual sneakers under a formal look (or vice versa) is a mismatch, not a plus.
- Layering: an outerwear piece worn over the top adds polish when it fits — favor outfits that layer well over ones that don't, all else equal.
- Confidence: would the wearer feel genuinely good walking out the door in this, not just "technically matching."
${preferenceLines.length > 0 ? `\nWhat's known about this specific person's preferences:\n${preferenceLines.join("\n")}\nWeight these lightly — they're preference signals, not hard rules.\n` : ""}
Pick the ${pickCount} that best hit those, ranked best first${context ? ` for ${context}` : ""}. For each pick, write one punchy, specific, encouraging sentence (max 20 words) on why it looks great.

Candidates:
${lines.join("\n")}

Respond as JSON: {"picks": [{"index": <candidate number>, "reason": "<sentence>"}]}, exactly ${pickCount} picks, best first, each index used once.`;
}

// Sends the rule-based candidate pool to Gemini to re-rank by subjective
// "looks great" quality and write punchier reasons — the rule-based scoring
// still guarantees every candidate is a structurally valid, color-coordinated
// outfit; this only reorders/relabels them. Returns null on any failure so
// the caller can fall back to the plain rule-based ranking.
export async function rankOutfitsWithAI(
  candidates,
  { season, occasion, pickCount = 3, styleDescriptor, inspirationDescriptors } = {}
) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || candidates.length === 0) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [
          { parts: [{ text: buildPrompt(candidates, { season, occasion, pickCount, styleDescriptor, inspirationDescriptors }) }] },
        ],
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

const VISION_TIMEOUT_MS = 15000;

// Turns an uploaded "inspiration" photo (Pinterest screenshot, etc.) into a
// short style descriptor Gemini can reuse later as ranking context — done
// once at upload time rather than per-suggestion, since it's the same image.
export async function describeInspirationImage(imageBuffer, mimeType) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), VISION_TIMEOUT_MS);

  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: "Describe this outfit's style in one short, punchy phrase (max 15 words) a stylist could use to recreate the vibe — focus on silhouette, color palette, and overall mood. No brand names, no filler like 'this image shows'.",
              },
              { inline_data: { mime_type: mimeType, data: imageBuffer.toString("base64") } },
            ],
          },
        ],
      }),
      signal: controller.signal,
    });
    if (!response.ok) return null;

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return text ? text.trim() : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
