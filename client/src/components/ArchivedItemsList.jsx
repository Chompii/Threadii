import { useEffect, useState } from "react";
import { getArchivedItems, setArchived } from "../api/client.js";
import { COLOR_SWATCH } from "../constants.js";
import Spinner from "./Spinner.jsx";

export default function ArchivedItemsList({ onRestored }) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);
  const [restoringId, setRestoringId] = useState(null);

  useEffect(() => {
    getArchivedItems()
      .then(setItems)
      .catch((err) => setError(err.message));
  }, []);

  async function handleRestore(item) {
    setRestoringId(item.id);
    try {
      const updated = await setArchived(item.id, false);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      onRestored(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setRestoringId(null);
    }
  }

  if (error) return <p className="font-caption text-sm text-red-600">{error}</p>;

  if (!items) {
    return (
      <p className="font-caption text-taupe text-sm flex items-center gap-2">
        <Spinner size={14} /> Loading archived items…
      </p>
    );
  }

  if (items.length === 0) {
    return (
      <p className="font-caption text-taupe text-sm text-center py-6">
        Nothing archived yet. Items you mark as donated or sold show up here.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="bg-white rounded-2xl border border-taupe/15 overflow-hidden shadow-sm"
        >
          <div className="aspect-square bg-sky/25 flex items-center justify-center opacity-60">
            {item.image_path ? (
              <img src={item.image_path} alt={item.name} className="w-full h-full object-cover" />
            ) : (
              <span
                className="w-10 h-10 rounded-full border border-black/10"
                style={{ backgroundColor: COLOR_SWATCH[item.color] || "#ccc" }}
              />
            )}
          </div>
          <div className="p-2.5 space-y-2">
            <p className="text-sm font-body font-bold text-ink truncate">{item.name}</p>
            <button
              onClick={() => handleRestore(item)}
              disabled={restoringId === item.id}
              className="w-full rounded-lg bg-steel text-cream py-1.5 text-xs font-body font-bold active:bg-steel-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {restoringId === item.id && <Spinner size={12} />}
              Restore
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
