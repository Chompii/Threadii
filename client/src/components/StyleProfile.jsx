import { useEffect, useState } from "react";
import { getStyleProfile, addStylePick, removeStylePick } from "../api/client.js";
import { COLOR_SWATCH } from "../constants.js";
import Sheet from "./Sheet.jsx";
import Spinner from "./Spinner.jsx";

const MAX_PICKS = 5;
const MIN_PIECES = 2;
const MAX_PIECES = 6;

function MiniOutfit({ items, onRemove, removing }) {
  return (
    <div className="bg-white rounded-2xl border border-taupe/15 p-3 shadow-sm relative">
      {onRemove && (
        <button
          onClick={onRemove}
          disabled={removing}
          aria-label="Remove look"
          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/90 text-ink/60 text-xs flex items-center justify-center active:text-red-600 active:bg-red-50 shadow z-10 disabled:opacity-50"
        >
          {removing ? <Spinner size={10} /> : "✕"}
        </button>
      )}
      <div className="flex gap-1.5 flex-wrap pr-6">
        {items.map((item) => (
          <div
            key={item.id}
            className="w-12 h-12 rounded-lg overflow-hidden bg-sky/25 flex items-center justify-center border border-taupe/15 shrink-0"
          >
            {item.image_path ? (
              <img src={item.image_path} alt={item.name} className="w-full h-full object-cover" />
            ) : (
              <span
                className="w-5 h-5 rounded-full border border-black/10"
                style={{ backgroundColor: COLOR_SWATCH[item.color] || "#ccc" }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ItemPicker({ items, selectedIds, onToggle }) {
  return (
    <div className="grid grid-cols-3 gap-2 max-h-[45vh] overflow-y-auto pr-0.5">
      {items.map((item) => {
        const selected = selectedIds.includes(item.id);
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onToggle(item.id)}
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
  );
}

export default function StyleProfile({ items }) {
  const [data, setData] = useState(null); // { picks, profile }
  const [error, setError] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    getStyleProfile()
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  function refresh() {
    getStyleProfile()
      .then(setData)
      .catch(() => {});
  }

  async function handleSave() {
    if (selectedIds.length < MIN_PIECES) {
      setSaveError(`Pick at least ${MIN_PIECES} pieces.`);
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      await addStylePick(selectedIds);
      setSelectedIds([]);
      setSheetOpen(false);
      refresh();
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(id) {
    setRemovingId(id);
    try {
      await removeStylePick(id);
      refresh();
    } catch {
      // leave it visible if the delete failed
    } finally {
      setRemovingId(null);
    }
  }

  if (error || !items || items.length === 0) return null;

  if (!data) {
    return (
      <div className="bg-white rounded-2xl border border-taupe/15 p-5 shadow-sm">
        <p className="font-caption text-taupe text-sm flex items-center gap-2">
          <Spinner size={14} /> Loading style profile…
        </p>
      </div>
    );
  }

  const { picks, profile } = data;
  const atCap = picks.length >= MAX_PICKS;

  return (
    <div className="bg-white rounded-2xl border border-taupe/15 p-5 shadow-sm space-y-3">
      <p className="font-caption text-xs text-taupe uppercase tracking-wide">Your style</p>
      {profile ? (
        <p className="font-body text-sm text-ink leading-relaxed">{profile.descriptor}</p>
      ) : (
        <p className="font-caption text-xs text-taupe">
          Pick a few outfits you actually love wearing, and suggestions will start leaning toward your taste.
        </p>
      )}

      {picks.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {picks.map((pick) => (
            <MiniOutfit
              key={pick.id}
              items={pick.items}
              onRemove={() => handleRemove(pick.id)}
              removing={removingId === pick.id}
            />
          ))}
        </div>
      )}

      {!atCap && (
        <button
          onClick={() => setSheetOpen(true)}
          className="w-full rounded-xl border border-taupe/25 text-ink py-2.5 text-sm font-body font-bold active:bg-sky/10 transition-colors"
        >
          + Add a look you love
        </button>
      )}

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="A look you love">
        <div className="space-y-4">
          <p className="font-caption text-xs text-taupe">
            Pick {MIN_PIECES}-{MAX_PIECES} pieces that make up an outfit you genuinely love wearing.
          </p>
          <ItemPicker
            items={items}
            selectedIds={selectedIds}
            onToggle={(id) =>
              setSelectedIds((prev) =>
                prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= MAX_PIECES ? prev : [...prev, id]
              )
            }
          />
          {saveError && <p className="font-caption text-sm text-red-600">{saveError}</p>}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-xl bg-steel text-cream py-3 text-sm font-body font-bold active:bg-steel-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <Spinner size={16} />}
            {saving ? "Saving…" : "Save this look"}
          </button>
        </div>
      </Sheet>
    </div>
  );
}
