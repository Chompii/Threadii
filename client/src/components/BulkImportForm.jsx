import { useState } from "react";
import { addItem } from "../api/client.js";
import { CATEGORIES, COLORS, SEASONS, OCCASIONS } from "../constants.js";

function prettifyName(filename) {
  const base = filename.replace(/\.[^./]+$/, "");
  const spaced = base.replace(/[-_]+/g, " ").trim();
  return spaced.replace(/\b\w/g, (c) => c.toUpperCase()) || "Untitled";
}

const tinySelect =
  "rounded-lg border border-taupe/25 bg-white px-2 py-1.5 text-xs font-body text-ink capitalize flex-1 min-w-0";

export default function BulkImportForm({ onBulkAdded }) {
  const [staged, setStaged] = useState([]);
  const [season, setSeason] = useState("all");
  const [occasion, setOccasion] = useState("casual");
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  function handleFiles(e) {
    const files = Array.from(e.target.files || []);
    const next = files.map((file, i) => ({
      id: `${Date.now()}-${i}`,
      file,
      preview: URL.createObjectURL(file),
      name: prettifyName(file.name),
      category: "top",
      color: "black",
    }));
    setStaged((prev) => [...prev, ...next]);
    e.target.value = "";
  }

  function updateStaged(id, key, value) {
    setStaged((prev) => prev.map((s) => (s.id === id ? { ...s, [key]: value } : s)));
  }

  function removeStaged(id) {
    setStaged((prev) => prev.filter((s) => s.id !== id));
  }

  async function handleImport() {
    if (staged.length === 0 || importing) return;
    setImporting(true);
    setError(null);
    setProgress(0);

    const createdItems = [];
    const remaining = [];

    for (const item of staged) {
      try {
        const formData = new FormData();
        formData.append("name", item.name.trim() || "Untitled");
        formData.append("category", item.category);
        formData.append("color", item.color);
        formData.append("season", season);
        formData.append("occasion", occasion);
        formData.append("image", item.file);
        const result = await addItem(formData);
        createdItems.push(result);
      } catch (err) {
        setError(`"${item.name}" failed: ${err.message}`);
        remaining.push(item);
      }
      setProgress((p) => p + 1);
    }

    setImporting(false);
    setStaged(remaining);
    if (createdItems.length > 0) onBulkAdded(createdItems);
  }

  return (
    <div className="space-y-4">
      <label
        htmlFor="bulk-files"
        className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-taupe/35 bg-white py-5 text-sm font-body font-medium text-taupe cursor-pointer active:scale-[0.98] transition-transform"
      >
        Select photos to import
        <input
          id="bulk-files"
          type="file"
          accept="image/*"
          multiple
          onChange={handleFiles}
          className="hidden"
        />
      </label>

      {staged.length > 0 && (
        <>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="font-caption text-xs text-taupe block mb-1">Season (all)</label>
              <select
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                className={`${tinySelect} w-full`}
              >
                {SEASONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="font-caption text-xs text-taupe block mb-1">Occasion (all)</label>
              <select
                value={occasion}
                onChange={(e) => setOccasion(e.target.value)}
                className={`${tinySelect} w-full`}
              >
                {OCCASIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2 max-h-[42vh] overflow-y-auto pr-0.5">
            {staged.map((item) => (
              <div
                key={item.id}
                className="flex gap-2 items-center bg-white rounded-xl border border-taupe/15 p-2"
              >
                <img
                  src={item.preview}
                  alt=""
                  className="w-12 h-12 rounded-lg object-cover shrink-0 border border-taupe/10"
                />
                <div className="flex-1 min-w-0 space-y-1.5">
                  <input
                    value={item.name}
                    onChange={(e) => updateStaged(item.id, "name", e.target.value)}
                    className="w-full text-sm font-body font-medium text-ink border-b border-taupe/20 focus:outline-none focus:border-steel pb-0.5"
                  />
                  <div className="flex gap-1.5">
                    <select
                      value={item.category}
                      onChange={(e) => updateStaged(item.id, "category", e.target.value)}
                      className={tinySelect}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <select
                      value={item.color}
                      onChange={(e) => updateStaged(item.id, "color", e.target.value)}
                      className={tinySelect}
                    >
                      {COLORS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  onClick={() => removeStaged(item.id)}
                  aria-label={`Remove ${item.name}`}
                  className="text-taupe/70 text-lg px-1.5 shrink-0"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {error && <p className="font-caption text-sm text-red-600">{error}</p>}

          <button
            onClick={handleImport}
            disabled={importing}
            className="w-full rounded-xl bg-steel text-cream py-3 text-sm font-body font-bold active:bg-steel-dark transition-colors disabled:opacity-50"
          >
            {importing
              ? `Importing ${progress}/${staged.length}…`
              : `Import ${staged.length} item${staged.length === 1 ? "" : "s"}`}
          </button>
        </>
      )}
    </div>
  );
}
