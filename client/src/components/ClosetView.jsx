import { useState } from "react";
import { CATEGORIES } from "../constants.js";
import ClosetGrid from "./ClosetGrid.jsx";
import EmptyState, { HangerIcon } from "./EmptyState.jsx";

const CHIP_OPTIONS = ["all", ...CATEGORIES];
const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "name", label: "Name (A–Z)" },
  { value: "category", label: "Category" },
];

export default function ClosetView({ items, onDelete, onEdit, onToggleLaundry }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("newest");

  const filtered = items.filter((item) => {
    if (category !== "all" && item.category !== category) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      item.name.toLowerCase().includes(q) ||
      item.color.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      (item.tags || []).some((t) => t.includes(q))
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "name") return a.name.localeCompare(b.name);
    if (sort === "category") return a.category.localeCompare(b.category) || a.name.localeCompare(b.name);
    return 0; // "newest" — API already returns newest-first
  });

  const isFiltering = query.trim() !== "" || category !== "all";

  return (
    <div className="space-y-4">
      {items.length > 0 && (
        <div className="space-y-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your closet…"
            className="w-full rounded-xl border border-taupe/25 bg-white px-3 py-2.5 text-sm font-body text-ink focus:outline-none focus:ring-2 focus:ring-steel/40"
          />
          <div className="flex items-center gap-2">
            <div className="flex-1 flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
              {CHIP_OPTIONS.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-caption font-medium capitalize transition-colors ${
                    category === c
                      ? "bg-steel text-cream"
                      : "bg-white text-taupe border border-taupe/20"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="shrink-0 rounded-full border border-taupe/20 bg-white px-2.5 py-1 text-xs font-caption text-taupe"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {items.length > 0 && isFiltering && sorted.length === 0 ? (
        <EmptyState
          icon={<HangerIcon />}
          title="No matches"
          subtitle={query.trim() ? `Nothing matches "${query.trim()}".` : "No items in this category."}
        />
      ) : (
        <ClosetGrid
          items={sorted}
          onDelete={onDelete}
          onEdit={onEdit}
          onToggleLaundry={onToggleLaundry}
        />
      )}
    </div>
  );
}
