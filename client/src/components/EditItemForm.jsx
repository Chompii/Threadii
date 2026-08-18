import { useRef, useState } from "react";
import { updateItem, deleteItem, setArchived } from "../api/client.js";
import { CATEGORIES, SEASONS, OCCASIONS } from "../constants.js";
import { detectDominantColorName } from "../colorDetection.js";
import Spinner from "./Spinner.jsx";
import TagInput from "./TagInput.jsx";
import ColorPicker from "./ColorPicker.jsx";

const fieldClass =
  "w-full rounded-xl border border-taupe/25 bg-white px-3 py-2.5 text-sm font-body text-ink focus:outline-none focus:ring-2 focus:ring-steel/40";

export default function EditItemForm({ item, onSaved, onDeleted, onArchived }) {
  const [fields, setFields] = useState({
    name: item.name,
    category: item.category,
    color: item.color,
    season: item.season,
    occasion: item.occasion,
  });
  const [tags, setTags] = useState(item.tags || []);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(item.image_path);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [error, setError] = useState(null);
  const [colorDetected, setColorDetected] = useState(false);
  const fileInputRef = useRef(null);

  function update(key, value) {
    setFields((f) => ({ ...f, [key]: value }));
    if (key === "color") setColorDetected(false);
  }

  async function handleFile(e) {
    const f = e.target.files?.[0] ?? null;
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));

    try {
      const detected = await detectDominantColorName(f);
      if (detected) {
        setFields((prev) => ({ ...prev, color: detected }));
        setColorDetected(true);
      }
    } catch {
      // detection is a nice-to-have; silently skip on any failure
    }
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

      const updated = await updateItem(item.id, formData);
      onSaved(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      await deleteItem(item.id);
      onDeleted(item.id);
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  }

  async function handleArchive() {
    setArchiving(true);
    setError(null);
    try {
      await setArchived(item.id, true);
      onArchived(item.id);
    } catch (err) {
      setError(err.message);
      setArchiving(false);
    }
  }

  const busy = submitting || deleting || archiving;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-4">
        <label
          htmlFor="edit-item-image"
          className="shrink-0 w-24 h-24 rounded-2xl border-2 border-dashed border-taupe/35 flex items-center justify-center overflow-hidden cursor-pointer bg-white active:scale-95 transition-transform"
        >
          {preview ? (
            <img src={preview} alt="preview" className="w-full h-full object-cover" />
          ) : (
            <span className="text-taupe font-caption text-xs text-center px-1">Add photo</span>
          )}
          <input
            id="edit-item-image"
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
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="font-caption text-xs text-taupe">Color</label>
          {colorDetected && (
            <span className="font-caption text-[11px] text-emerald-600">Detected from photo</span>
          )}
        </div>
        <ColorPicker value={fields.color} onChange={(c) => update("color", c)} />
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
        disabled={busy}
        className="w-full rounded-xl bg-steel text-cream py-3 text-sm font-body font-bold active:bg-steel-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {submitting && <Spinner size={16} />}
        {submitting ? "Saving…" : "Save changes"}
      </button>

      <button
        type="button"
        onClick={handleArchive}
        disabled={busy}
        className="w-full rounded-xl border border-taupe/25 text-ink py-2.5 text-sm font-body font-bold active:bg-sky/10 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {archiving && <Spinner size={16} />}
        {archiving ? "Archiving…" : "Archive (donated / sold)"}
      </button>

      <button
        type="button"
        onClick={handleDelete}
        disabled={busy}
        className="w-full rounded-xl border border-red-200 text-red-600 py-2.5 text-sm font-body font-bold active:bg-red-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {deleting && <Spinner size={16} className="text-red-600" />}
        {deleting ? "Removing…" : "Remove from closet"}
      </button>
    </form>
  );
}
