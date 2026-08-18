import { useEffect, useRef, useState } from "react";
import { getInspiration, addInspiration, removeInspiration } from "../api/client.js";
import Spinner from "./Spinner.jsx";

const MAX_IMAGES = 3;

export default function InspirationBoard() {
  const [images, setImages] = useState(null);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [removingId, setRemovingId] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    getInspiration()
      .then(setImages)
      .catch((err) => setError(err.message));
  }, []);

  function refresh() {
    getInspiration()
      .then(setImages)
      .catch(() => {});
  }

  async function handleFile(e) {
    const file = e.target.files?.[0] ?? null;
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("image", file);
      await addInspiration(formData);
      refresh();
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove(id) {
    setRemovingId(id);
    try {
      await removeInspiration(id);
      refresh();
    } catch {
      // leave it visible if the delete failed
    } finally {
      setRemovingId(null);
    }
  }

  if (error) return null;

  if (!images) {
    return (
      <div className="bg-white rounded-2xl border border-taupe/15 p-5 shadow-sm">
        <p className="font-caption text-taupe text-sm flex items-center gap-2">
          <Spinner size={14} /> Loading inspiration…
        </p>
      </div>
    );
  }

  const atCap = images.length >= MAX_IMAGES;

  return (
    <div className="bg-white rounded-2xl border border-taupe/15 p-5 shadow-sm space-y-3">
      <p className="font-caption text-xs text-taupe uppercase tracking-wide">Inspiration</p>
      <p className="font-caption text-xs text-taupe">
        Upload a look you found on Pinterest, Google, or anywhere else — suggestions will lean toward that vibe.
      </p>

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((img) => (
            <div key={img.id} className="relative">
              <button
                onClick={() => handleRemove(img.id)}
                disabled={removingId === img.id}
                aria-label="Remove inspiration photo"
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-white/90 text-ink/60 text-xs flex items-center justify-center active:text-red-600 active:bg-red-50 shadow z-10 disabled:opacity-50"
              >
                {removingId === img.id ? <Spinner size={10} /> : "✕"}
              </button>
              <div className="aspect-square rounded-xl overflow-hidden bg-sky/25 border border-taupe/15">
                <img src={img.image_path} alt="Inspiration" className="w-full h-full object-cover" />
              </div>
              <p className="font-caption text-[10px] text-taupe leading-tight mt-1 line-clamp-2">
                {img.descriptor || "Style summary unavailable — still usable, just no caption"}
              </p>
            </div>
          ))}
        </div>
      )}

      {uploadError && <p className="font-caption text-sm text-red-600">{uploadError}</p>}

      {!atCap && (
        <label
          htmlFor="inspiration-upload"
          className="block w-full rounded-xl border border-taupe/25 text-ink py-2.5 text-sm font-body font-bold text-center active:bg-sky/10 transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {uploading && <Spinner size={16} />}
          {uploading ? "Analyzing style…" : "+ Add inspiration photo"}
          <input
            id="inspiration-upload"
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFile}
            disabled={uploading}
            className="hidden"
          />
        </label>
      )}
    </div>
  );
}
