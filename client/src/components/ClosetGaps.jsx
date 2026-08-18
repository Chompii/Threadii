import { NEUTRAL_COLORS } from "../constants.js";

const OCCASIONS_TO_CHECK = ["casual", "formal", "sport"];
const MIN_ITEMS_FOR_COLOR_CHECK = 5;
const LOW_NEUTRAL_THRESHOLD = 0.5; // styling guides target ~60-70% neutrals

function analyzeGaps(items) {
  const gaps = [];
  const byCategory = {};
  items.forEach((i) => {
    byCategory[i.category] = (byCategory[i.category] || 0) + 1;
  });

  if (!byCategory.top && !byCategory.dress) {
    gaps.push("No tops or dresses yet — outfit suggestions need at least one.");
  }
  if (!byCategory.bottom && !byCategory.dress) {
    gaps.push("No bottoms or dresses yet.");
  }
  if (!byCategory.shoes) {
    gaps.push("No shoes logged yet.");
  }

  OCCASIONS_TO_CHECK.forEach((occ) => {
    const hasOccasion = items.some((i) => i.occasion === occ);
    if (!hasOccasion) gaps.push(`Nothing tagged for ${occ} occasions.`);
  });

  if (items.length >= MIN_ITEMS_FOR_COLOR_CHECK) {
    const neutralCount = items.filter((i) => NEUTRAL_COLORS.has(i.color)).length;
    const neutralRatio = neutralCount / items.length;
    if (neutralRatio < LOW_NEUTRAL_THRESHOLD) {
      const bottomNeutrals = items.filter((i) => i.category === "bottom" && NEUTRAL_COLORS.has(i.color)).length;
      const hint = bottomNeutrals === 0 && byCategory.bottom ? " A neutral bottom (black, navy, gray) would unlock the most new combos." : "";
      gaps.push(`Mostly bold colors, not many neutrals — harder to mix and match.${hint}`);
    }
  }

  return gaps;
}

export default function ClosetGaps({ items }) {
  if (items.length === 0) return null;
  const gaps = analyzeGaps(items);

  return (
    <div className="bg-white rounded-2xl border border-taupe/15 p-5 shadow-sm space-y-2">
      <p className="font-caption text-xs text-taupe uppercase tracking-wide">Closet gaps</p>
      {gaps.length === 0 ? (
        <p className="font-caption text-xs text-emerald-600">
          No obvious gaps — nice, well-rounded closet.
        </p>
      ) : (
        <ul className="space-y-1">
          {gaps.map((g) => (
            <li key={g} className="font-caption text-xs text-taupe">
              • {g}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
