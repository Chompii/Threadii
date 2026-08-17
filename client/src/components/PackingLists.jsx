import { useEffect, useState } from "react";
import { getPackingLists, createPackingList, deletePackingList } from "../api/client.js";
import { COLOR_SWATCH } from "../constants.js";
import OutfitSuggestions from "./OutfitSuggestions.jsx";
import Spinner from "./Spinner.jsx";
import EmptyState, { HangerIcon } from "./EmptyState.jsx";

const fieldClass =
  "w-full rounded-xl border border-taupe/25 bg-white px-3 py-2.5 text-sm font-body text-ink focus:outline-none focus:ring-2 focus:ring-steel/40";

function ItemGrid({ items, selectedIds, onToggle }) {
  return (
    <div className="grid grid-cols-3 gap-2 max-h-[40vh] overflow-y-auto pr-0.5">
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

export default function PackingLists({ items }) {
  const [lists, setLists] = useState(null);
  const [error, setError] = useState(null);
  const [view, setView] = useState("overview"); // overview | create
  const [detailListId, setDetailListId] = useState(null);
  const [name, setName] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getPackingLists()
      .then(setLists)
      .catch((err) => setError(err.message));
  }, []);

  async function handleCreate() {
    if (!name.trim()) {
      setError("Give it a name.");
      return;
    }
    if (selectedIds.length === 0) {
      setError("Pick at least one item.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const created = await createPackingList(name.trim(), selectedIds);
      setLists((prev) => [created, ...(prev || [])]);
      setName("");
      setSelectedIds([]);
      setView("overview");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    setLists((prev) => prev.filter((l) => l.id !== id));
    if (detailListId === id) setDetailListId(null);
    try {
      await deletePackingList(id);
    } catch {
      // list already removed from view; not worth a rollback for MVP
    }
  }

  const detailList = lists?.find((l) => l.id === detailListId) || null;

  if (detailList) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setDetailListId(null)}
          className="font-caption text-sm text-steel font-bold"
        >
          ← All packing lists
        </button>
        <div>
          <p className="font-display font-extrabold text-lg text-ink">{detailList.name}</p>
          <p className="font-caption text-xs text-taupe">{detailList.items.length} items packed</p>
        </div>
        <OutfitSuggestions items={detailList.items} />
      </div>
    );
  }

  if (view === "create") {
    return (
      <div className="space-y-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Beach trip"
          className={fieldClass}
        />
        <ItemGrid
          items={items}
          selectedIds={selectedIds}
          onToggle={(id) =>
            setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
          }
        />
        {error && <p className="font-caption text-sm text-red-600">{error}</p>}
        <button
          onClick={handleCreate}
          disabled={saving}
          className="w-full rounded-xl bg-steel text-cream py-3 text-sm font-body font-bold active:bg-steel-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving && <Spinner size={16} />}
          {saving ? "Creating…" : "Create list"}
        </button>
        <button
          onClick={() => {
            setView("overview");
            setError(null);
          }}
          disabled={saving}
          className="w-full rounded-xl border border-taupe/25 text-ink py-2.5 text-sm font-body font-bold active:bg-sky/10 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    );
  }

  if (error && !lists) return <p className="font-caption text-sm text-red-600">{error}</p>;

  if (!lists) {
    return (
      <p className="font-caption text-taupe text-sm flex items-center gap-2">
        <Spinner size={14} /> Loading packing lists…
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <button
        onClick={() => setView("create")}
        className="w-full rounded-xl bg-steel text-cream py-3 text-sm font-body font-bold active:bg-steel-dark transition-colors"
      >
        + New packing list
      </button>

      {lists.length === 0 ? (
        <EmptyState
          icon={<HangerIcon />}
          title="No packing lists yet"
          subtitle="Create one for a trip to get outfit suggestions built only from what you've packed."
        />
      ) : (
        <div className="space-y-2">
          {lists.map((list) => (
            <div
              key={list.id}
              className="bg-white rounded-2xl border border-taupe/15 shadow-sm flex items-center"
            >
              <button
                onClick={() => setDetailListId(list.id)}
                className="flex-1 text-left p-4"
              >
                <p className="font-body font-bold text-sm text-ink">{list.name}</p>
                <p className="font-caption text-xs text-taupe">{list.items.length} items</p>
              </button>
              <button
                onClick={() => handleDelete(list.id)}
                aria-label={`Delete ${list.name}`}
                className="w-10 h-10 mr-2 rounded-full flex items-center justify-center text-taupe active:text-red-600 active:bg-red-50 shrink-0"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
