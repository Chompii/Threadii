import { useRef, useState } from "react";
import { COLOR_SWATCH } from "../constants.js";
import { harmonyLabel } from "../colorHarmony.js";
import HeartIcon from "./HeartIcon.jsx";
import Spinner from "./Spinner.jsx";

const SWIPE_THRESHOLD = 70;
const MAX_DRAG = 100;

function DismissIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="#dc2626" strokeWidth="1.6" />
      <path d="M9 9l6 6M15 9l-6 6" stroke="#dc2626" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export default function OutfitCard({
  title,
  pieces,
  harmony,
  description,
  isFavorite,
  onToggleFavorite,
  onClick,
  enableSwipe = false,
  onSwipeFavorite,
  onSwipeDislike,
}) {
  const [busy, setBusy] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const label = harmonyLabel(harmony);

  const startPos = useRef({ x: 0, y: 0 });
  const axisLocked = useRef(null);
  const justSwiped = useRef(false);

  async function handleToggle(e) {
    e.stopPropagation();
    if (!onToggleFavorite || busy) return;
    setBusy(true);
    try {
      await onToggleFavorite();
    } finally {
      setBusy(false);
    }
  }

  function handlePointerDown(e) {
    if (!enableSwipe || e.target.closest("button")) return;
    startPos.current = { x: e.clientX, y: e.clientY };
    axisLocked.current = null;
  }

  function handlePointerMove(e) {
    if (!enableSwipe || axisLocked.current === "y") return;
    const dx = e.clientX - startPos.current.x;
    const dy = e.clientY - startPos.current.y;

    if (axisLocked.current === null) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      axisLocked.current = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      if (axisLocked.current === "x") {
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          // pointer capture isn't always available (e.g. synthetic events) — safe to ignore
        }
      }
    }
    if (axisLocked.current !== "x") return;

    e.preventDefault();
    setDragging(true);
    justSwiped.current = true;
    setDragX(Math.max(-MAX_DRAG, Math.min(dx, MAX_DRAG)));
  }

  function handlePointerUp() {
    if (!enableSwipe) return;
    if (dragging && dragX > SWIPE_THRESHOLD && !isFavorite) {
      onSwipeFavorite?.();
    } else if (dragging && dragX < -SWIPE_THRESHOLD && onSwipeDislike) {
      onSwipeDislike();
    }
    setDragging(false);
    setDragX(0);
    axisLocked.current = null;
    setTimeout(() => {
      justSwiped.current = false;
    }, 50);
  }

  function handleClick() {
    if (justSwiped.current) return;
    onClick?.();
  }

  const rightRevealOpacity = Math.min(Math.max(dragX, 0) / SWIPE_THRESHOLD, 1);
  const leftRevealOpacity = Math.min(Math.max(-dragX, 0) / SWIPE_THRESHOLD, 1);

  // The card shows the core look — top/bottom/dress + outerwear. Shoes (and
  // any accessory picked in the detail view) are still part of the real
  // outfit, just surfaced on the detail screen instead of cluttering the card.
  const summaryPieces = pieces.filter((p) => p.category !== "shoes");
  const hasMore = summaryPieces.length < pieces.length;

  return (
    <div className="relative">
      {enableSwipe && (
        <div
          className="absolute inset-0 rounded-2xl bg-emerald-100 flex items-center pl-5"
          style={{ opacity: rightRevealOpacity }}
          aria-hidden="true"
        >
          <HeartIcon filled size={22} />
        </div>
      )}
      {enableSwipe && onSwipeDislike && (
        <div
          className="absolute inset-0 rounded-2xl bg-rose-100 flex items-center justify-end pr-5"
          style={{ opacity: leftRevealOpacity }}
          aria-hidden="true"
        >
          <DismissIcon />
        </div>
      )}
      <div
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          transform: `translateX(${dragX}px)`,
          transition: dragging ? "none" : "transform 0.25s ease-out",
          touchAction: enableSwipe ? "pan-y" : undefined,
        }}
        className={`relative bg-white rounded-2xl border border-taupe/15 p-4 shadow-sm space-y-3 ${
          onClick ? "active:scale-[0.98] transition-transform cursor-pointer" : ""
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          {title && <span className="font-display font-extrabold text-ink">{title}</span>}
          <div className="flex items-center gap-2 ml-auto">
            <span className={`font-caption text-xs px-2 py-0.5 rounded-full font-medium ${label.tone}`}>
              {label.text}
            </span>
            {onToggleFavorite && (
              <button
                onClick={handleToggle}
                disabled={busy}
                aria-label={isFavorite ? "Remove from favorites" : "Save to favorites"}
                className="w-7 h-7 flex items-center justify-center disabled:opacity-50"
              >
                {busy ? <Spinner size={16} className="text-steel" /> : <HeartIcon filled={isFavorite} />}
              </button>
            )}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {summaryPieces.map((p) => {
            const isOuterwear = p.category === "outerwear";
            return (
              <div key={p.id} className={isOuterwear ? "flex-[1.6] min-w-[100px]" : "flex-1 min-w-[70px]"}>
                <div
                  className={`rounded-xl bg-sky/25 overflow-hidden flex items-center justify-center border ${
                    isOuterwear ? "aspect-[4/3] border-2 border-steel/30" : "aspect-square border-taupe/15"
                  }`}
                >
                  {p.image_path ? (
                    <img src={p.image_path} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <span
                      className={`rounded-full border border-black/10 ${isOuterwear ? "w-8 h-8" : "w-6 h-6"}`}
                      style={{ backgroundColor: COLOR_SWATCH[p.color] || "#ccc" }}
                    />
                  )}
                </div>
                <p
                  className={`font-caption text-[11px] truncate mt-1 text-center capitalize ${
                    isOuterwear ? "text-ink font-bold" : "text-taupe"
                  }`}
                >
                  {p.name}
                </p>
              </div>
            );
          })}
        </div>
        {description && (
          <p className="font-body text-sm text-ink/80 leading-snug line-clamp-2">{description}</p>
        )}
        {onClick && (
          <p className="font-caption text-xs text-steel">
            {hasMore ? "Shoes & more inside — tap for details →" : "Tap for details →"}
          </p>
        )}
        {enableSwipe && !isFavorite && (
          <p className="font-caption text-[11px] text-taupe/70">
            {onSwipeDislike ? "← Dismiss   ·   Swipe right to save →" : "Swipe right to save →"}
          </p>
        )}
      </div>
    </div>
  );
}
