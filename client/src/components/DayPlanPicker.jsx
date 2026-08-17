import { useState } from "react";
import { COLOR_SWATCH } from "../constants.js";
import Spinner from "./Spinner.jsx";

export default function DayPlanPicker({ items, initialSelectedIds, onSave, onClear, hasExisting }) {
  const [selectedIds, setSelectedIds] = useState(initialSelectedIds);
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState(null);

  function toggle(id) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleSave() {
    if (selectedIds.length === 0) {
      setError("Pick at least one piece.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(selectedIds);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleClear() {
    setClearing(true);
    setError(null);
    try {
      await onClear();
    } catch (err) {
      setError(err.message);
    } finally {
      setClearing(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2 max-h-[50vh] overflow-y-auto pr-0.5">
        {items.map((item) => {
          const selected = selectedIds.includes(item.id);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => toggle(item.id)}
              className="flex flex-col items-center gap-1"
            >
              <div
                className={`relative w-full aspect-square rounded-xl overflow-hidden bg-sky/25 flex items-center justify-center border-2 transition-colors ${
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

      {error && <p className="font-caption text-sm text-red-600">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving || clearing}
        className="w-full rounded-xl bg-steel text-cream py-3 text-sm font-body font-bold active:bg-steel-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {saving && <Spinner size={16} />}
        {saving ? "Saving…" : "Save plan"}
      </button>

      {hasExisting && (
        <button
          onClick={handleClear}
          disabled={saving || clearing}
          className="w-full rounded-xl border border-red-200 text-red-600 py-2.5 text-sm font-body font-bold active:bg-red-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {clearing && <Spinner size={16} className="text-red-600" />}
          {clearing ? "Clearing…" : "Clear this day"}
        </button>
      )}
    </div>
  );
}
