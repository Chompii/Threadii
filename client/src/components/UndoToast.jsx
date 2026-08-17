export default function UndoToast({ message, onUndo }) {
  return (
    <div className="fixed inset-x-0 bottom-20 z-40 px-4 animate-[toast-up_0.2s_ease-out]">
      <div className="max-w-md mx-auto bg-ink text-cream rounded-xl shadow-lg px-4 py-3 flex items-center justify-between gap-3">
        <p className="font-body text-sm truncate">{message}</p>
        <button onClick={onUndo} className="font-caption text-sm font-bold text-sky shrink-0">
          Undo
        </button>
      </div>
      <style>{`
        @keyframes toast-up {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
