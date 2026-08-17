import { useState } from "react";
import AddItemForm from "./AddItemForm.jsx";
import BulkImportForm from "./BulkImportForm.jsx";

export default function AddSheetContent({ onAdded, onBulkAdded }) {
  const [mode, setMode] = useState("single");

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-sky/20 rounded-full p-1">
        <button
          onClick={() => setMode("single")}
          className={`flex-1 rounded-full py-1.5 text-sm font-body font-bold transition-colors ${
            mode === "single" ? "bg-white text-ink shadow-sm" : "text-taupe"
          }`}
        >
          Single item
        </button>
        <button
          onClick={() => setMode("bulk")}
          className={`flex-1 rounded-full py-1.5 text-sm font-body font-bold transition-colors ${
            mode === "bulk" ? "bg-white text-ink shadow-sm" : "text-taupe"
          }`}
        >
          Bulk import
        </button>
      </div>

      {mode === "single" ? (
        <AddItemForm onAdded={onAdded} />
      ) : (
        <BulkImportForm onBulkAdded={onBulkAdded} />
      )}
    </div>
  );
}
