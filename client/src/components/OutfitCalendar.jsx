import { useEffect, useState } from "react";
import { getCalendar, setCalendarDay, removeCalendarDay } from "../api/client.js";
import { COLOR_SWATCH } from "../constants.js";
import Sheet from "./Sheet.jsx";
import DayPlanPicker from "./DayPlanPicker.jsx";
import EmptyState, { HangerIcon } from "./EmptyState.jsx";
import Spinner from "./Spinner.jsx";

const DAYS_AHEAD = 14;

function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function dayLabel(date, index) {
  if (index === 0) return "Today";
  if (index === 1) return "Tomorrow";
  return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export default function OutfitCalendar({ items }) {
  const [plansByDate, setPlansByDate] = useState(null);
  const [error, setError] = useState(null);
  const [sheetDate, setSheetDate] = useState(null);

  useEffect(() => {
    getCalendar()
      .then((rows) => {
        const map = {};
        rows.forEach((r) => {
          map[r.date] = r;
        });
        setPlansByDate(map);
      })
      .catch((err) => setError(err.message));
  }, []);

  async function handleSave(date, itemIds) {
    const updated = await setCalendarDay(date, itemIds);
    setPlansByDate((prev) => ({ ...prev, [date]: updated }));
    setSheetDate(null);
  }

  async function handleClear(date) {
    await removeCalendarDay(date);
    setPlansByDate((prev) => {
      const next = { ...prev };
      delete next[date];
      return next;
    });
    setSheetDate(null);
  }

  if (error) return <p className="font-caption text-sm text-red-600">{error}</p>;

  if (!plansByDate) {
    return (
      <p className="font-caption text-taupe text-sm flex items-center gap-2">
        <Spinner size={14} /> Loading calendar…
      </p>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<HangerIcon />}
        title="Add closet items first"
        subtitle="You'll need a few pieces before you can plan what to wear."
      />
    );
  }

  const days = Array.from({ length: DAYS_AHEAD }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  const activeSheetPlan = sheetDate ? plansByDate[sheetDate] : null;

  return (
    <div className="space-y-3">
      {days.map((date, i) => {
        const key = toDateKey(date);
        const plan = plansByDate[key];
        return (
          <button
            key={key}
            onClick={() => setSheetDate(key)}
            className="w-full bg-white rounded-2xl border border-taupe/15 p-3 shadow-sm flex items-center gap-3 text-left active:scale-[0.99] transition-transform"
          >
            <div className="w-16 shrink-0">
              <p className="font-body font-bold text-sm text-ink">{dayLabel(date, i)}</p>
              {i > 1 && <p className="font-caption text-[11px] text-taupe">{date.getFullYear()}</p>}
            </div>
            {plan ? (
              <div className="flex-1 flex gap-1.5 overflow-x-auto">
                {plan.pieces.map((p) => (
                  <div
                    key={p.id}
                    className="w-10 h-10 rounded-lg bg-sky/25 overflow-hidden flex items-center justify-center border border-taupe/15 shrink-0"
                  >
                    {p.image_path ? (
                      <img src={p.image_path} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <span
                        className="w-4 h-4 rounded-full border border-black/10"
                        style={{ backgroundColor: COLOR_SWATCH[p.color] || "#ccc" }}
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="flex-1 font-caption text-sm text-taupe">+ Plan an outfit</p>
            )}
          </button>
        );
      })}

      <Sheet
        open={Boolean(sheetDate)}
        onClose={() => setSheetDate(null)}
        title={sheetDate ? `Plan for ${sheetDate}` : "Plan"}
      >
        {sheetDate && (
          <DayPlanPicker
            items={items}
            initialSelectedIds={activeSheetPlan ? activeSheetPlan.pieces.map((p) => p.id) : []}
            hasExisting={Boolean(activeSheetPlan)}
            onSave={(ids) => handleSave(sheetDate, ids)}
            onClear={() => handleClear(sheetDate)}
          />
        )}
      </Sheet>
    </div>
  );
}
