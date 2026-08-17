import { useState } from "react";
import { exportData } from "../api/client.js";
import ClosetGaps from "./ClosetGaps.jsx";
import WearStats from "./WearStats.jsx";
import Spinner from "./Spinner.jsx";

function formatMemberSince(createdAt) {
  if (!createdAt) return null;
  const iso = createdAt.includes("T") ? createdAt : createdAt.replace(" ", "T") + "Z";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

export default function AccountTab({ user, items, onLogout, onOpenArchived }) {
  const [loggingOut, setLoggingOut] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(null);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await onLogout();
    } finally {
      setLoggingOut(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    setExportError(null);
    try {
      const data = await exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `threadii-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setExportError(err.message);
    } finally {
      setExporting(false);
    }
  }

  const memberSince = formatMemberSince(user?.createdAt);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-taupe/15 p-5 shadow-sm space-y-1">
        <p className="font-caption text-xs text-taupe uppercase tracking-wide">Signed in as</p>
        <p className="font-display font-extrabold text-lg text-ink break-all">{user?.email}</p>
        {memberSince && (
          <p className="font-caption text-xs text-taupe">Member since {memberSince}</p>
        )}
      </div>

      <WearStats />

      <ClosetGaps items={items} />

      <div className="bg-white rounded-2xl border border-taupe/15 p-5 shadow-sm space-y-3">
        <p className="font-caption text-xs text-taupe uppercase tracking-wide">Closet management</p>
        <button
          onClick={onOpenArchived}
          className="w-full rounded-xl border border-taupe/25 text-ink py-2.5 text-sm font-body font-bold active:bg-sky/10 transition-colors"
        >
          Archived items
        </button>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="w-full rounded-xl border border-taupe/25 text-ink py-2.5 text-sm font-body font-bold active:bg-sky/10 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {exporting && <Spinner size={16} />}
          {exporting ? "Preparing…" : "Download my data"}
        </button>
        {exportError && <p className="font-caption text-xs text-red-600">{exportError}</p>}
      </div>

      <button
        onClick={handleLogout}
        disabled={loggingOut}
        className="w-full rounded-xl border border-red-200 text-red-600 py-2.5 text-sm font-body font-bold active:bg-red-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loggingOut && <Spinner size={16} className="text-red-600" />}
        {loggingOut ? "Logging out…" : "Log out"}
      </button>
    </div>
  );
}
