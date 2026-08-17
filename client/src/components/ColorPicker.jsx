import { COLORS, COLOR_SWATCH } from "../constants.js";

export default function ColorPicker({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2 p-2 rounded-xl border border-taupe/25 bg-white">
      {COLORS.map((c) => {
        const selected = c === value;
        const swatch = COLOR_SWATCH[c];
        const isLight = c === "white" || c === "cream";
        return (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            aria-label={c}
            aria-pressed={selected}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform ${
              selected ? "scale-110 ring-2 ring-steel ring-offset-2 ring-offset-white" : "active:scale-95"
            } ${isLight ? "border border-taupe/25" : ""}`}
            style={{ backgroundColor: swatch }}
          >
            {selected && (
              <svg width="14" height="14" viewBox="0 0 24 24">
                <path
                  d="M4 12l5 5L20 6"
                  stroke={isLight ? "#171412" : "#ffffff"}
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        );
      })}
    </div>
  );
}
