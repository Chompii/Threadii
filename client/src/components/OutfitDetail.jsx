import { useEffect, useRef, useState } from "react";
import { COLOR_SWATCH } from "../constants.js";
import { harmonyLabel } from "../colorHarmony.js";
import { getAccessorySuggestions, addFavorite } from "../api/client.js";
import HeartIcon from "./HeartIcon.jsx";
import Spinner from "./Spinner.jsx";

const NOTE_SAVE_DELAY = 700;

function formatWornDate(wornAt) {
  if (!wornAt) return null;
  const iso = wornAt.includes("T") ? wornAt : wornAt.replace(" ", "T") + "Z";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function OutfitDetail({
  outfit,
  isFavorite,
  onToggleFavorite,
  onBack,
  allowNotes = false,
  note = "",
  onNoteChange,
  collection = null,
  onCollectionChange,
  existingCollections = [],
  isWorn = false,
  wornAt = null,
  onMarkWorn,
  onUnmarkWorn,
}) {
  const [favBusy, setFavBusy] = useState(false);
  const [wornBusy, setWornBusy] = useState(false);
  const [noteValue, setNoteValue] = useState(note);
  const [noteStatus, setNoteStatus] = useState("idle"); // idle | saving | saved
  const [collectionValue, setCollectionValue] = useState(collection || "");
  const [collectionStatus, setCollectionStatus] = useState("idle");
  const [accessories, setAccessories] = useState([]);
  const [selectedAccessoryId, setSelectedAccessoryId] = useState(null);
  const [accessorySaveStatus, setAccessorySaveStatus] = useState("idle"); // idle | saving | saved
  const saveTimer = useRef(null);
  const collectionTimer = useRef(null);
  const label = harmonyLabel(outfit.harmony);

  useEffect(() => {
    setNoteValue(note);
  }, [note]);

  useEffect(() => {
    setSelectedAccessoryId(null);
    setAccessorySaveStatus("idle");
    getAccessorySuggestions(outfit.pieces.map((p) => p.id))
      .then(setAccessories)
      .catch(() => setAccessories([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outfit.pieces.map((p) => p.id).join(",")]);

  const selectedAccessory = accessories.find((a) => a.id === selectedAccessoryId) || null;

  async function handleSaveWithAccessory() {
    if (!selectedAccessory || accessorySaveStatus === "saving") return;
    setAccessorySaveStatus("saving");
    try {
      await addFavorite([...outfit.pieces.map((p) => p.id), selectedAccessory.id]);
      setAccessorySaveStatus("saved");
    } catch {
      setAccessorySaveStatus("idle");
    }
  }

  useEffect(() => {
    setCollectionValue(collection || "");
  }, [collection]);

  useEffect(
    () => () => {
      clearTimeout(saveTimer.current);
      clearTimeout(collectionTimer.current);
    },
    []
  );

  function handleNoteInput(value) {
    setNoteValue(value);
    setNoteStatus("saving");
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await onNoteChange?.(value);
      setNoteStatus("saved");
      setTimeout(() => setNoteStatus((s) => (s === "saved" ? "idle" : s)), 1500);
    }, NOTE_SAVE_DELAY);
  }

  function handleCollectionInput(value) {
    setCollectionValue(value);
    setCollectionStatus("saving");
    clearTimeout(collectionTimer.current);
    collectionTimer.current = setTimeout(async () => {
      await onCollectionChange?.(value.trim() || null);
      setCollectionStatus("saved");
      setTimeout(() => setCollectionStatus((s) => (s === "saved" ? "idle" : s)), 1500);
    }, NOTE_SAVE_DELAY);
  }

  async function handleToggle() {
    if (!onToggleFavorite || favBusy) return;
    setFavBusy(true);
    try {
      await onToggleFavorite();
    } finally {
      setFavBusy(false);
    }
  }

  async function handleMarkWorn() {
    if (!onMarkWorn || wornBusy) return;
    setWornBusy(true);
    try {
      await onMarkWorn();
    } finally {
      setWornBusy(false);
    }
  }

  async function handleUnmarkWorn() {
    if (!onUnmarkWorn || wornBusy) return;
    setWornBusy(true);
    try {
      await onUnmarkWorn();
    } finally {
      setWornBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 bg-cream animate-[detail-in_0.22s_ease-out] flex flex-col">
      <div className="safe-top bg-steel shrink-0">
        <div className="max-w-md mx-auto px-3 py-3 flex items-center gap-2">
          <button
            onClick={onBack}
            aria-label="Back"
            className="w-9 h-9 rounded-full flex items-center justify-center text-cream active:bg-white/10"
          >
            ←
          </button>
          <h2 className="font-display font-extrabold text-lg text-cream flex-1">Outfit</h2>
          {onToggleFavorite && (
            <button
              onClick={handleToggle}
              disabled={favBusy}
              aria-label={isFavorite ? "Remove from favorites" : "Save to favorites"}
              className="w-9 h-9 rounded-full flex items-center justify-center disabled:opacity-50"
            >
              {favBusy ? (
                <Spinner size={18} className="text-cream" />
              ) : (
                <HeartIconOnDark filled={isFavorite} />
              )}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-md mx-auto px-4 py-5 pb-10 space-y-5">
          <span className={`inline-block font-caption text-xs px-2.5 py-1 rounded-full font-medium ${label.tone}`}>
            {label.text}
          </span>

          <div className="grid grid-cols-2 gap-3">
            {outfit.pieces.map((p) => {
              const isOuterwear = p.category === "outerwear";
              return (
                <div
                  key={p.id}
                  className={`bg-white rounded-2xl border overflow-hidden shadow-sm ${
                    isOuterwear ? "col-span-2 border-2 border-steel/30" : "border-taupe/15"
                  }`}
                >
                  <div className={`bg-sky/25 flex items-center justify-center ${isOuterwear ? "aspect-[2/1]" : "aspect-square"}`}>
                    {p.image_path ? (
                      <img src={p.image_path} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <span
                        className="w-10 h-10 rounded-full border border-black/10"
                        style={{ backgroundColor: COLOR_SWATCH[p.color] || "#ccc" }}
                      />
                    )}
                  </div>
                  <div className="px-2.5 py-2 flex items-center justify-between gap-2">
                    <p className="font-body text-sm font-bold text-ink truncate">{p.name}</p>
                    {isOuterwear && (
                      <span className="font-caption text-[10px] text-steel font-bold uppercase tracking-wide shrink-0">
                        Layered
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-white rounded-2xl border border-taupe/15 p-4 shadow-sm">
            <h3 className="font-caption text-xs text-taupe uppercase tracking-wide mb-1.5">Why it works</h3>
            <p className="font-body text-sm text-ink leading-relaxed">{outfit.description}</p>
          </div>

          {accessories.length > 0 && (
            <div className="bg-white rounded-2xl border border-taupe/15 p-4 shadow-sm space-y-3">
              <h3 className="font-caption text-xs text-taupe uppercase tracking-wide">
                Accessories that would work
              </h3>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {accessories.map((a) => {
                  const selected = a.id === selectedAccessoryId;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => {
                        setSelectedAccessoryId(selected ? null : a.id);
                        setAccessorySaveStatus("idle");
                      }}
                      className="shrink-0 w-16 flex flex-col items-center gap-1"
                    >
                      <div
                        className={`w-16 h-16 rounded-xl overflow-hidden bg-sky/25 flex items-center justify-center border-2 transition-colors ${
                          selected ? "border-steel" : "border-transparent"
                        }`}
                      >
                        {a.image_path ? (
                          <img src={a.image_path} alt={a.name} className="w-full h-full object-cover" />
                        ) : (
                          <span
                            className="w-7 h-7 rounded-full border border-black/10"
                            style={{ backgroundColor: COLOR_SWATCH[a.color] || "#ccc" }}
                          />
                        )}
                      </div>
                      <span
                        className={`font-caption text-[10px] truncate w-full text-center ${
                          selected ? "text-steel font-bold" : "text-taupe"
                        }`}
                      >
                        {a.name}
                      </span>
                    </button>
                  );
                })}
              </div>
              {selectedAccessory && (
                <button
                  onClick={handleSaveWithAccessory}
                  disabled={accessorySaveStatus === "saving" || accessorySaveStatus === "saved"}
                  className="w-full rounded-xl border border-steel/30 text-steel py-2.5 text-sm font-body font-bold active:bg-sky/10 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {accessorySaveStatus === "saving" && <Spinner size={14} />}
                  {accessorySaveStatus === "saved"
                    ? `Saved with ${selectedAccessory.name} ✓`
                    : `Save look with ${selectedAccessory.name}`}
                </button>
              )}
            </div>
          )}

          {(onMarkWorn || onUnmarkWorn) && (
            <div className="bg-white rounded-2xl border border-taupe/15 p-4 shadow-sm space-y-2">
              <h3 className="font-caption text-xs text-taupe uppercase tracking-wide">Wear tracking</h3>
              {isWorn ? (
                <div className="flex items-center justify-between gap-2">
                  <p className="font-body text-sm text-ink">
                    ✓ Marked as worn{formatWornDate(wornAt) ? ` · ${formatWornDate(wornAt)}` : ""}
                  </p>
                  <button
                    onClick={handleUnmarkWorn}
                    disabled={wornBusy}
                    className="font-caption text-xs text-steel font-bold shrink-0 disabled:opacity-50"
                  >
                    Undo
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={handleMarkWorn}
                    disabled={wornBusy}
                    className="w-full rounded-xl bg-ink text-cream py-2.5 text-sm font-body font-bold active:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {wornBusy && <Spinner size={14} />}
                    I wore this
                  </button>
                  <p className="font-caption text-[11px] text-taupe">
                    Keeps this exact combo out of future suggestions.
                  </p>
                </>
              )}
            </div>
          )}

          {allowNotes && onCollectionChange && (
            <div className="bg-white rounded-2xl border border-taupe/15 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1.5">
                <h3 className="font-caption text-xs text-taupe uppercase tracking-wide">Collection</h3>
                {collectionStatus === "saving" && (
                  <span className="font-caption text-xs text-taupe flex items-center gap-1">
                    <Spinner size={11} /> Saving
                  </span>
                )}
                {collectionStatus === "saved" && (
                  <span className="font-caption text-xs text-emerald-600">Saved</span>
                )}
              </div>
              <input
                type="text"
                list="collection-suggestions"
                value={collectionValue}
                onChange={(e) => handleCollectionInput(e.target.value)}
                placeholder="e.g. Work, Date night"
                className="w-full rounded-xl border border-taupe/25 px-3 py-2 text-sm font-body text-ink focus:outline-none focus:ring-2 focus:ring-steel/40"
              />
              <datalist id="collection-suggestions">
                {existingCollections.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
          )}

          {allowNotes && (
            <div className="bg-white rounded-2xl border border-taupe/15 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1.5">
                <h3 className="font-caption text-xs text-taupe uppercase tracking-wide">Note</h3>
                {noteStatus === "saving" && (
                  <span className="font-caption text-xs text-taupe flex items-center gap-1">
                    <Spinner size={11} /> Saving
                  </span>
                )}
                {noteStatus === "saved" && (
                  <span className="font-caption text-xs text-emerald-600">Saved</span>
                )}
              </div>
              <textarea
                value={noteValue}
                onChange={(e) => handleNoteInput(e.target.value)}
                placeholder="e.g. Wore this to the interview, felt great"
                rows={3}
                className="w-full rounded-xl border border-taupe/25 px-3 py-2 text-sm font-body text-ink focus:outline-none focus:ring-2 focus:ring-steel/40 resize-none"
              />
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes detail-in {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

function HeartIconOnDark({ filled }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path
        d="M12 20.5s-7.5-4.6-10-9.3C.5 7.8 2.3 4.5 5.6 4.1c1.9-.2 3.7.8 4.9 2.4a.6.6 0 001 0c1.2-1.6 3-2.6 4.9-2.4 3.3.4 5.1 3.7 3.6 7.1-2.5 4.7-10 9.3-10 9.3z"
        fill={filled ? "#F1EAD9" : "none"}
        stroke="#F1EAD9"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
