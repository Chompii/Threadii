import { useState } from "react";

const SUGGESTED_TAGS = ["work", "casual", "gym", "date night", "vacation", "formal"];

export default function TagInput({ tags, onChange }) {
  const [draft, setDraft] = useState("");

  function addTag(raw) {
    const t = raw.trim().toLowerCase();
    if (!t || tags.includes(t)) return;
    onChange([...tags, t]);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(draft);
      setDraft("");
    } else if (e.key === "Backspace" && draft === "" && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  }

  function handleBlur() {
    if (draft.trim()) {
      addTag(draft);
      setDraft("");
    }
  }

  function removeTag(t) {
    onChange(tags.filter((x) => x !== t));
  }

  const remainingSuggestions = SUGGESTED_TAGS.filter((s) => !tags.includes(s));

  return (
    <div className="space-y-2">
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 rounded-full bg-sky/25 text-ink px-2.5 py-1 text-xs font-caption"
            >
              {t}
              <button
                type="button"
                onClick={() => removeTag(t)}
                aria-label={`Remove tag ${t}`}
                className="text-taupe"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder="Add a tag, press Enter"
        className="w-full rounded-xl border border-taupe/25 bg-white px-3 py-2 text-sm font-body text-ink focus:outline-none focus:ring-2 focus:ring-steel/40"
      />
      {remainingSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {remainingSuggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => addTag(s)}
              className="rounded-full border border-taupe/25 text-taupe px-2.5 py-1 text-xs font-caption"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
