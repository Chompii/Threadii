import { useEffect, useState } from "react";
import { getStats } from "../api/client.js";
import { COLOR_SWATCH } from "../constants.js";
import Spinner from "./Spinner.jsx";

function Thumb({ item }) {
  return (
    <div className="w-11 h-11 rounded-lg bg-sky/25 overflow-hidden flex items-center justify-center border border-taupe/15 shrink-0">
      {item.image_path ? (
        <img src={item.image_path} alt={item.name} className="w-full h-full object-cover" />
      ) : (
        <span
          className="w-5 h-5 rounded-full border border-black/10"
          style={{ backgroundColor: COLOR_SWATCH[item.color] || "#ccc" }}
        />
      )}
    </div>
  );
}

export default function WearStats() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return null;

  if (!stats) {
    return (
      <div className="bg-white rounded-2xl border border-taupe/15 p-5 shadow-sm">
        <p className="font-caption text-taupe text-sm flex items-center gap-2">
          <Spinner size={14} /> Loading wear stats…
        </p>
      </div>
    );
  }

  if (stats.totalItems === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-taupe/15 p-5 shadow-sm space-y-4">
      <div>
        <p className="font-caption text-xs text-taupe uppercase tracking-wide">Wear stats</p>
        <p className="font-caption text-xs text-taupe mt-0.5">
          {stats.totalItems} active items · {stats.neverWornCount} never marked worn
        </p>
      </div>

      {stats.mostWorn.length > 0 && (
        <div className="space-y-2">
          <p className="font-body text-sm font-bold text-ink">Most worn</p>
          <div className="space-y-1.5">
            {stats.mostWorn.map((entry) => (
              <div key={entry.item.id} className="flex items-center gap-2.5">
                <Thumb item={entry.item} />
                <p className="flex-1 font-body text-sm text-ink truncate">{entry.item.name}</p>
                <span className="font-caption text-xs text-steel font-bold shrink-0">
                  {entry.wearCount}×
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats.staleItems.length > 0 && (
        <div className="space-y-2">
          <p className="font-body text-sm font-bold text-ink">Haven't worn in a while</p>
          <div className="space-y-1.5">
            {stats.staleItems.map((entry) => (
              <div key={entry.item.id} className="flex items-center gap-2.5">
                <Thumb item={entry.item} />
                <p className="flex-1 font-body text-sm text-ink truncate">{entry.item.name}</p>
                <span className="font-caption text-xs text-taupe shrink-0">
                  {entry.everWorn ? `${entry.daysSinceWorn}d ago` : "never worn"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats.mostWorn.length === 0 && stats.staleItems.length === 0 && (
        <p className="font-caption text-xs text-taupe">
          Mark outfits as worn to start seeing patterns here.
        </p>
      )}
    </div>
  );
}
