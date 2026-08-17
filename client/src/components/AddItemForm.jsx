import { useRef, useState } from "react";
import { addItem } from "../api/client.js";
import { CATEGORIES, COLORS, SEASONS, OCCASIONS } from "../constants.js";
import Spinner from "./Spinner.jsx";
import TagInput from "./TagInput.jsx";

const initial = {
  name: "",
  category: "top",
  color: "black",
  season: "all",
  occasion: "casual",
};

const fieldClass =
  "w-full rounded-xl border border-taupe/25 bg-white px-3 py-2.5 text-sm font-body text-ink focus:outline-none focus:ring-2 focus:ring-steel/40";

export default function AddItemForm({ onAdded }) {
  const [fields, setFields] = useState(initial);
  const [tags, setTags] = useState([]);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  function update(key, value) {
    setFields((f) => ({ ...f, [key]: value }));
  }

  function handleFile(e) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!fields.name.trim()) {
      setError("Give the item a name.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const formData = new FormData();
      Object.entries(fields).forEach(([k, v]) => formData.append(k, v));
      formData.append("tags", JSON.stringify(tags));
      if (file) formData.append("image", file);

      const item = await addItem(formData);
      onAdded(item);
      setFields(initial);
      setTags([]);
      setFile(null);
      setPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-4">
        <label
          htmlFor="item-image"
          className="shrink-0 w-24 h-24 rounded-2xl border-2 border-dashed border-taupe/35 flex items-center justify-center overflow-hidden cursor-pointer bg-white active:scale-95 transition-transform"
        >
          {preview ? (
            <img src={preview} alt="preview" className="w-full h-full object-cover" />
          ) : (
            <span className="text-taupe font-caption text-xs text-center px-1">Add photo</span>
          )}
          <input
            id="item-image"
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFile}
            className="hidden"
          />
        </label>

        <div className="flex-1 space-y-2">
          <input
            type="text"
            placeholder="e.g. Blue chambray shirt"
            value={fields.name}
            onChange={(e) => update("name", e.target.value)}
            className={fieldClass}
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={fields.category}
              onChange={(e) => update("category", e.target.value)}
              className={`${fieldClass} capitalize`}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              value={fields.color}
              onChange={(e) => update("color", e.target.value)}
              className={`${fieldClass} capitalize`}
            >
              {COLORS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="font-caption text-xs text-taupe block mb-1">Season</label>
          <select
            value={fields.season}
            onChange={(e) => update("season", e.target.value)}
            className={`${fieldClass} capitalize`}
          >
            {SEASONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="font-caption text-xs text-taupe block mb-1">Occasion</label>
          <select
            value={fields.occasion}
            onChange={(e) => update("occasion", e.target.value)}
            className={`${fieldClass} capitalize`}
          >
            {OCCASIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="font-caption text-xs text-taupe block mb-1">Tags</label>
        <TagInput tags={tags} onChange={setTags} />
      </div>

      {error && <p className="font-caption text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-steel text-cream py-3 text-sm font-body font-bold active:bg-steel-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {submitting && <Spinner size={16} />}
        {submitting ? "Adding…" : "Add to closet"}
      </button>
    </form>
  );
}
