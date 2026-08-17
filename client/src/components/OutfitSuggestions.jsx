import { useEffect, useState } from "react";
import {
  suggestOutfits,
  getFavorites,
  addFavorite,
  removeFavorite,
  getWorn,
  markWorn,
  unmarkWorn,
  markDisliked,
  unmarkDisliked,
} from "../api/client.js";
import { SEASONS, OCCASIONS } from "../constants.js";
import { signatureOf, signatureOfIds } from "../outfitSignature.js";
import { detectWeatherSeason } from "../weatherSeason.js";
import OutfitCard from "./OutfitCard.jsx";
import OutfitDetail from "./OutfitDetail.jsx";
import AnchorPicker from "./AnchorPicker.jsx";
import Spinner from "./Spinner.jsx";
import EmptyState, { HangerIcon } from "./EmptyState.jsx";
import UndoToast from "./UndoToast.jsx";

const selectClass =
  "rounded-xl border border-taupe/25 bg-white px-2.5 py-2 text-sm font-body text-ink capitalize";

export default function OutfitSuggestions({ items }) {
  const hasItems = items.length > 0;
  const [season, setSeason] = useState("all");
  const [occasion, setOccasion] = useState("all");
  const [anchorIds, setAnchorIds] = useState([]);
  const [outfits, setOutfits] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherNote, setWeatherNote] = useState(null);
  const [weatherError, setWeatherError] = useState(null);
  const [dismissed, setDismissed] = useState(null); // { outfit, dislikeId }
  // signature -> favorite id, so we know which cards are already saved
  const [favoritesBySignature, setFavoritesBySignature] = useState({});
  // signature -> { id, wornAt }, so we know which cards were already marked worn
  const [wornBySignature, setWornBySignature] = useState({});

  useEffect(() => {
    getFavorites().then((favs) => {
      const map = {};
      favs.forEach((f) => {
        map[signatureOf(f.pieces)] = f.id;
      });
      setFavoritesBySignature(map);
    });
    getWorn().then((records) => {
      const map = {};
      records.forEach((r) => {
        map[signatureOfIds(r.itemIds)] = { id: r.id, wornAt: r.wornAt };
      });
      setWornBySignature(map);
    });
  }, []);

  const anchorItems = anchorIds.map((id) => items.find((i) => i.id === id)).filter(Boolean);

  async function handleUseWeather() {
    setWeatherLoading(true);
    setWeatherError(null);
    setWeatherNote(null);
    try {
      const { season: detected, temp } = await detectWeatherSeason();
      setSeason(detected);
      setWeatherNote(
        typeof temp === "number"
          ? `${Math.round(temp)}°C right now → set to ${detected}`
          : `Set to ${detected}`
      );
    } catch (err) {
      setWeatherError(err.message);
    } finally {
      setWeatherLoading(false);
    }
  }

  async function handleSuggest() {
    setLoading(true);
    setError(null);
    setSelectedIndex(null);
    try {
      const result = await suggestOutfits({ season, occasion, anchorIds });
      setOutfits(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleFavorite(outfit) {
    const sig = signatureOf(outfit.pieces);
    const existingId = favoritesBySignature[sig];

    if (existingId) {
      setFavoritesBySignature((prev) => {
        const next = { ...prev };
        delete next[sig];
        return next;
      });
      try {
        await removeFavorite(existingId);
      } catch {
        setFavoritesBySignature((prev) => ({ ...prev, [sig]: existingId }));
      }
    } else {
      const optimisticId = `pending-${sig}`;
      setFavoritesBySignature((prev) => ({ ...prev, [sig]: optimisticId }));
      try {
        const created = await addFavorite(outfit.pieces.map((p) => p.id));
        setFavoritesBySignature((prev) => ({ ...prev, [sig]: created.id }));
      } catch {
        setFavoritesBySignature((prev) => {
          const next = { ...prev };
          delete next[sig];
          return next;
        });
      }
    }
  }

  async function handleMarkWorn(outfit) {
    const sig = signatureOf(outfit.pieces);
    const optimisticId = `pending-${sig}`;
    setWornBySignature((prev) => ({ ...prev, [sig]: { id: optimisticId, wornAt: new Date().toISOString() } }));
    try {
      const created = await markWorn(outfit.pieces.map((p) => p.id));
      setWornBySignature((prev) => ({ ...prev, [sig]: { id: created.id, wornAt: created.wornAt } }));
    } catch {
      setWornBySignature((prev) => {
        const next = { ...prev };
        delete next[sig];
        return next;
      });
    }
  }

  async function handleUnmarkWorn(outfit) {
    const sig = signatureOf(outfit.pieces);
    const existing = wornBySignature[sig];
    if (!existing) return;
    setWornBySignature((prev) => {
      const next = { ...prev };
      delete next[sig];
      return next;
    });
    try {
      await unmarkWorn(existing.id);
    } catch {
      setWornBySignature((prev) => ({ ...prev, [sig]: existing }));
    }
  }

  async function handleDislike(outfit) {
    try {
      const created = await markDisliked(outfit.pieces.map((p) => p.id));
      setOutfits((prev) => (prev ? prev.filter((o) => signatureOf(o.pieces) !== signatureOf(outfit.pieces)) : prev));
      setDismissed({ outfit, dislikeId: created.id });
      setTimeout(() => {
        setDismissed((cur) => (cur?.dislikeId === created.id ? null : cur));
      }, 5000);
    } catch {
      // swallow — worst case the card just stays visible
    }
  }

  async function handleUndoDislike() {
    if (!dismissed) return;
    const { outfit, dislikeId } = dismissed;
    setDismissed(null);
    try {
      await unmarkDisliked(dislikeId);
      setOutfits((prev) => (prev ? [...prev, outfit] : prev));
    } catch {
      // if the undo call fails, the outfit just stays excluded going forward
    }
  }

  const selectedOutfit = selectedIndex !== null ? outfits?.[selectedIndex] : null;
  const anchorLabel = anchorItems.map((a) => a.name).join(" & ");

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-taupe/15 p-4 shadow-sm space-y-3">
        <AnchorPicker items={items} anchorIds={anchorIds} onChange={setAnchorIds} />

        <div className="flex gap-2">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <label className="font-caption text-xs text-taupe">Season</label>
              <button
                type="button"
                onClick={handleUseWeather}
                disabled={weatherLoading}
                className="font-caption text-[11px] text-steel font-bold flex items-center gap-1 disabled:opacity-50"
              >
                {weatherLoading && <Spinner size={10} />}
                {weatherLoading ? "Locating…" : "Use weather"}
              </button>
            </div>
            <select
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              className={`${selectClass} w-full`}
            >
              {SEASONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="font-caption text-xs text-taupe block mb-1">Occasion</label>
            <select
              value={occasion}
              onChange={(e) => setOccasion(e.target.value)}
              className={`${selectClass} w-full`}
            >
              {OCCASIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
        </div>
        {weatherNote && (
          <p className="font-caption text-xs text-emerald-600 -mt-1">{weatherNote}</p>
        )}
        {weatherError && (
          <p className="font-caption text-xs text-red-600 -mt-1">{weatherError}</p>
        )}
        <button
          onClick={handleSuggest}
          disabled={!hasItems || loading}
          className="w-full rounded-xl bg-steel text-cream py-3 text-sm font-body font-bold active:bg-steel-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && <Spinner size={16} />}
          {loading
            ? "Thinking…"
            : anchorItems.length > 0
              ? `Build around ${anchorLabel}`
              : "Suggest outfits"}
        </button>
        {!hasItems && (
          <p className="font-caption text-xs text-taupe text-center">
            Add some items to your closet first.
          </p>
        )}
      </div>

      {error && <p className="font-caption text-sm text-red-600">{error}</p>}

      {outfits && outfits.length === 0 && (
        <EmptyState
          icon={<HangerIcon />}
          title="No outfit fits that yet"
          subtitle={
            anchorItems.length > 0
              ? `Nothing pairs with ${anchorLabel} under those filters — try widening season/occasion or adding more pieces.`
              : "You likely need at least a top + bottom, or a dress."
          }
        />
      )}

      {outfits && outfits.length > 0 && (
        <div className="space-y-4">
          {outfits.map((outfit, i) => (
            <OutfitCard
              key={signatureOf(outfit.pieces)}
              title={`Outfit ${i + 1}`}
              pieces={outfit.pieces}
              harmony={outfit.harmony}
              description={outfit.description}
              isFavorite={Boolean(favoritesBySignature[signatureOf(outfit.pieces)])}
              onToggleFavorite={() => handleToggleFavorite(outfit)}
              onClick={() => setSelectedIndex(i)}
              enableSwipe
              onSwipeFavorite={() => handleToggleFavorite(outfit)}
              onSwipeDislike={() => handleDislike(outfit)}
            />
          ))}
        </div>
      )}

      {selectedOutfit && (
        <OutfitDetail
          outfit={selectedOutfit}
          isFavorite={Boolean(favoritesBySignature[signatureOf(selectedOutfit.pieces)])}
          onToggleFavorite={() => handleToggleFavorite(selectedOutfit)}
          onBack={() => setSelectedIndex(null)}
          isWorn={Boolean(wornBySignature[signatureOf(selectedOutfit.pieces)])}
          wornAt={wornBySignature[signatureOf(selectedOutfit.pieces)]?.wornAt}
          onMarkWorn={() => handleMarkWorn(selectedOutfit)}
          onUnmarkWorn={() => handleUnmarkWorn(selectedOutfit)}
        />
      )}

      {dismissed && <UndoToast message="Won't suggest that combo again" onUndo={handleUndoDislike} />}
    </div>
  );
}
