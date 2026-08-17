import { COLOR_SWATCH } from "../constants.js";

export default function AnchorPicker({ items, anchorIds, onChange }) {
  if (items.length === 0) return null;

  const itemsById = new Map(items.map((i) => [i.id, i]));

  function toggle(item) {
    if (anchorIds.includes(item.id)) {
      onChange(anchorIds.filter((id) => id !== item.id));
      return;
    }
    // Only one anchor per category makes sense (can't wear two tops at once)
    const sameCategoryId = anchorIds.find((id) => itemsById.get(id)?.category === item.category);
    if (sameCategoryId) {
      onChange(anchorIds.map((id) => (id === sameCategoryId ? item.id : id)));
      return;
    }
    if (anchorIds.length < 2) {
      onChange([...anchorIds, item.id]);
      return;
    }
    // already have 2 anchors in different categories — swap out the oldest
    onChange([anchorIds[1], item.id]);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="font-caption text-xs text-taupe">
          Build around up to 2 pieces (optional)
        </label>
        {anchorIds.length > 0 && (
          <button
            onClick={() => onChange([])}
            className="font-caption text-xs text-steel font-bold"
          >
            Clear
          </button>
        )}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {items.map((item) => {
          const selected = anchorIds.includes(item.id);
          return (
            <button
              key={item.id}
              onClick={() => toggle(item)}
              className="shrink-0 w-16 flex flex-col items-center gap-1"
            >
              <div
                className={`relative w-14 h-14 rounded-xl overflow-hidden bg-sky/25 flex items-center justify-center border-2 transition-colors ${
                  selected ? "border-steel" : "border-transparent"
                }`}
              >
                {item.image_path ? (
                  <img src={item.image_path} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <span
                    className="w-6 h-6 rounded-full border border-black/10"
                    style={{ backgroundColor: COLOR_SWATCH[item.color] || "#ccc" }}
                  />
                )}
                {selected && (
                  <span className="absolute inset-0 bg-steel/30 flex items-center justify-center text-cream text-lg font-bold">
                    ✓
                  </span>
                )}
              </div>
              <span
                className={`font-caption text-[10px] truncate w-full text-center ${
                  selected ? "text-steel font-bold" : "text-taupe"
                }`}
              >
                {item.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
