import { useEffect, useState } from "react";
import {
  getFavorites,
  removeFavorite,
  updateFavoriteNote,
  updateFavoriteCollection,
  getWorn,
  markWorn,
  unmarkWorn,
} from "../api/client.js";
import { signatureOf, signatureOfIds } from "../outfitSignature.js";
import OutfitCard from "./OutfitCard.jsx";
import OutfitDetail from "./OutfitDetail.jsx";
import EmptyState from "./EmptyState.jsx";
import HeartIcon from "./HeartIcon.jsx";
import { SkeletonRows } from "./SkeletonGrid.jsx";

export default function FavoritesGrid() {
  const [favorites, setFavorites] = useState(null);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  // signature -> { id, wornAt }
  const [wornBySignature, setWornBySignature] = useState({});

  useEffect(() => {
    getFavorites()
      .then(setFavorites)
      .catch((err) => setError(err.message));
    getWorn().then((records) => {
      const map = {};
      records.forEach((r) => {
        map[signatureOfIds(r.itemIds)] = { id: r.id, wornAt: r.wornAt };
      });
      setWornBySignature(map);
    });
  }, []);

  async function handleRemove(id) {
    const prev = favorites;
    setFavorites((cur) => cur.filter((f) => f.id !== id));
    if (selectedId === id) setSelectedId(null);
    try {
      await removeFavorite(id);
    } catch {
      setFavorites(prev);
    }
  }

  async function handleNoteChange(id, note) {
    setFavorites((cur) => cur.map((f) => (f.id === id ? { ...f, note } : f)));
    try {
      await updateFavoriteNote(id, note);
    } catch {
      // keep the typed value locally even if the save failed; next successful
      // save will reconcile it
    }
  }

  async function handleCollectionChange(id, collection) {
    setFavorites((cur) => cur.map((f) => (f.id === id ? { ...f, collection } : f)));
    try {
      await updateFavoriteCollection(id, collection);
    } catch {
      // keep the typed value locally even if the save failed
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

  if (error) return <p className="font-caption text-sm text-red-600">{error}</p>;

  if (!favorites) {
    return <SkeletonRows />;
  }

  if (favorites.length === 0) {
    return (
      <EmptyState
        icon={<HeartIcon filled={false} size={36} />}
        title="No favorites yet"
        subtitle="Tap the heart on an outfit you like to save it here."
      />
    );
  }

  const selected = favorites.find((f) => f.id === selectedId) || null;
  const selectedWorn = selected ? wornBySignature[signatureOf(selected.pieces)] : null;
  const existingCollections = [...new Set(favorites.map((f) => f.collection).filter(Boolean))].sort();

  const groups = new Map();
  favorites.forEach((f) => {
    const key = f.collection || "Uncategorized";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(f);
  });
  const sortedGroupNames = [...groups.keys()].sort((a, b) => {
    if (a === "Uncategorized") return 1;
    if (b === "Uncategorized") return -1;
    return a.localeCompare(b);
  });

  return (
    <div className="space-y-6">
      {sortedGroupNames.map((groupName) => (
        <div key={groupName} className="space-y-4">
          <h2 className="font-caption text-xs text-taupe uppercase tracking-wide">
            {groupName} · {groups.get(groupName).length}
          </h2>
          {groups.get(groupName).map((fav) => (
            <OutfitCard
              key={fav.id}
              pieces={fav.pieces}
              harmony={fav.harmony}
              description={fav.description}
              isFavorite
              onToggleFavorite={() => handleRemove(fav.id)}
              onClick={() => setSelectedId(fav.id)}
            />
          ))}
        </div>
      ))}

      {selected && (
        <OutfitDetail
          outfit={selected}
          isFavorite
          onToggleFavorite={() => handleRemove(selected.id)}
          onBack={() => setSelectedId(null)}
          allowNotes
          note={selected.note}
          onNoteChange={(note) => handleNoteChange(selected.id, note)}
          collection={selected.collection}
          onCollectionChange={(collection) => handleCollectionChange(selected.id, collection)}
          existingCollections={existingCollections}
          isWorn={Boolean(selectedWorn)}
          wornAt={selectedWorn?.wornAt}
          onMarkWorn={() => handleMarkWorn(selected)}
          onUnmarkWorn={() => handleUnmarkWorn(selected)}
        />
      )}
    </div>
  );
}
