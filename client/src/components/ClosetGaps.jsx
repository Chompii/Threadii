const OCCASIONS_TO_CHECK = ["casual", "formal", "sport"];

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
