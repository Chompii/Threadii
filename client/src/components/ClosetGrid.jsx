import { useState } from "react";
import { COLOR_SWATCH } from "../constants.js";
import EmptyState, { HangerIcon } from "./EmptyState.jsx";
import Spinner from "./Spinner.jsx";

function DropletIcon({ active }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2.5S5 11 5 15.5a7 7 0 0014 0C19 11 12 2.5 12 2.5z"
        stroke={active ? "#F1EAD9" : "#8A6F52"}
        strokeWidth="1.6"
        fill={active ? "#3D6A85" : "none"}
      />
    </svg>
  );
}

function ItemCard({ item, onDelete, onEdit, onToggleLaundry }) {
  const [laundryBusy, setLaundryBusy] = useState(false);

  async function handleToggleLaundry(e) {
    e.stopPropagation();
    if (laundryBusy) return;
    setLaundryBusy(true);
    try {
      await onToggleLaundry(item);
    } finally {
      setLaundryBusy(false);
    }
  }

  return (
    <div
      onClick={() => onEdit?.(item)}
      className="group relative bg-white rounded-2xl border border-taupe/15 overflow-hidden shadow-sm active:scale-[0.98] transition-transform cursor-pointer"
    >
      <div className="aspect-square bg-sky/25 flex items-center justify-center relative">
        {item.image_path ? (
          <img
            src={item.image_path}
            alt={item.name}
            className={`w-full h-full object-cover ${item.in_laundry ? "opacity-40" : ""}`}
          />
        ) : (
          <span
            className="w-10 h-10 rounded-full border border-black/10"
            style={{ backgroundColor: COLOR_SWATCH[item.color] || "#ccc" }}
          />
        )}
        {item.in_laundry && (
          <span className="absolute inset-x-0 bottom-0 bg-ink/70 text-cream font-caption text-[10px] text-center py-1">
            In the wash
          </span>
        )}
      </div>
      <div className="p-2.5 space-y-1">
        <p className="text-sm font-body font-bold text-ink truncate">{item.name}</p>
        <div className="flex items-center gap-1.5">
          <span
            className="w-3 h-3 rounded-full border border-black/10 shrink-0"
            style={{ backgroundColor: COLOR_SWATCH[item.color] || "#ccc" }}
          />
          <p className="font-caption text-xs text-taupe capitalize truncate">
            {item.category} · {item.season} · {item.occasion}
          </p>
        </div>
        {item.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.tags.map((t) => (
              <span
                key={t}
                className="font-caption text-[10px] bg-sky/20 text-ink px-1.5 py-0.5 rounded-full"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
      <button
        onClick={handleToggleLaundry}
        disabled={laundryBusy}
        aria-label={item.in_laundry ? `Mark ${item.name} as clean` : `Mark ${item.name} as in the wash`}
        className="absolute top-1.5 right-9 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center active:bg-white shadow disabled:opacity-50"
      >
        {laundryBusy ? <Spinner size={12} /> : <DropletIcon active={item.in_laundry} />}
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(item);
        }}
        aria-label={`Remove ${item.name}`}
        className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-white/90 text-ink/60 text-xs flex items-center justify-center active:text-red-600 active:bg-white shadow"
      >
        ✕
      </button>
    </div>
  );
}

export default function ClosetGrid({ items, onDelete, onEdit, onToggleLaundry }) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={<HangerIcon />}
        title="Your closet is empty"
        subtitle="Tap the + button to add your first piece."
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item) => (
        <ItemCard
          key={item.id}
          item={item}
          onDelete={onDelete}
          onEdit={onEdit}
          onToggleLaundry={onToggleLaundry}
        />
      ))}
    </div>
  );
}
