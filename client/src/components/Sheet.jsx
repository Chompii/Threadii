import { useEffect } from "react";

export default function Sheet({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40">
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-ink/40 backdrop-blur-[1px]"
      />
      <div className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-3xl bg-cream shadow-2xl safe-bottom animate-[sheet-up_0.22s_ease-out]">
        <div className="sticky top-0 bg-cream/95 backdrop-blur px-5 pt-3 pb-2 flex items-center justify-between border-b border-taupe/15">
          <div className="mx-auto absolute left-1/2 -translate-x-1/2 top-1.5 w-10 h-1 rounded-full bg-taupe/30" />
          <h2 className="font-display font-extrabold text-lg text-ink pt-2">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full bg-ink/5 text-ink flex items-center justify-center text-sm mt-1"
          >
            ✕
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
      <style>{`
        @keyframes sheet-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
