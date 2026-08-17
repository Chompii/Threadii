import { useEffect, useState } from "react";
import { getItems, deleteItem, getMe, logoutRequest, setLaundry } from "./api/client.js";
import { getToken, setToken } from "./auth.js";
import AddSheetContent from "./components/AddSheetContent.jsx";
import EditItemForm from "./components/EditItemForm.jsx";
import ClosetView from "./components/ClosetView.jsx";
import OutfitSuggestions from "./components/OutfitSuggestions.jsx";
import FavoritesGrid from "./components/FavoritesGrid.jsx";
import OutfitCalendar from "./components/OutfitCalendar.jsx";
import AccountTab from "./components/AccountTab.jsx";
import ArchivedItemsList from "./components/ArchivedItemsList.jsx";
import AuthScreen from "./components/AuthScreen.jsx";
import BottomNav from "./components/BottomNav.jsx";
import Sheet from "./components/Sheet.jsx";
import UndoToast from "./components/UndoToast.jsx";
import SkeletonGrid from "./components/SkeletonGrid.jsx";
import Logo from "./components/Logo.jsx";
import Spinner from "./components/Spinner.jsx";

const UNDO_DELAY = 5000;

export default function App() {
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [tab, setTab] = useState("closet");
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [archivedSheetOpen, setArchivedSheetOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  useEffect(() => {
    if (!getToken()) {
      setAuthChecked(true);
      return;
    }
    getMe()
      .then(({ user: me }) => setUser(me))
      .catch(() => setToken(null))
      .finally(() => setAuthChecked(true));
  }, []);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getItems()
      .then(setItems)
      .finally(() => setLoading(false));
  }, [user]);

  async function handleLogout() {
    try {
      await logoutRequest();
    } catch {
      // token may already be invalid server-side; clear locally regardless
    }
    setToken(null);
    setUser(null);
    setItems([]);
    setTab("closet");
    setEditingItem(null);
    setSheetOpen(false);
    if (pendingDelete) clearTimeout(pendingDelete.timerId);
    setPendingDelete(null);
  }

  function handleDelete(item) {
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    if (pendingDelete) clearTimeout(pendingDelete.timerId);
    const timerId = setTimeout(async () => {
      setPendingDelete(null);
      try {
        await deleteItem(item.id);
      } catch {
        // if this fails the item is already gone from view; not worth surfacing for MVP
      }
    }, UNDO_DELAY);
    setPendingDelete({ item, timerId });
  }

  function handleUndoDelete() {
    if (!pendingDelete) return;
    clearTimeout(pendingDelete.timerId);
    setItems((prev) => [pendingDelete.item, ...prev]);
    setPendingDelete(null);
  }

  async function handleToggleLaundry(item) {
    const nextValue = !item.in_laundry;
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, in_laundry: nextValue } : i)));
    try {
      await setLaundry(item.id, nextValue);
    } catch {
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, in_laundry: item.in_laundry } : i)));
    }
  }

  function handleAdded(item) {
    setItems((prev) => [item, ...prev]);
    setSheetOpen(false);
  }

  function handleBulkAdded(newItems) {
    setItems((prev) => [...newItems, ...prev]);
    setSheetOpen(false);
  }

  function handleItemSaved(updated) {
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    setEditingItem(null);
  }

  function handleItemDeleted(id) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setEditingItem(null);
  }

  function handleItemArchived(id) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setEditingItem(null);
  }

  function handleItemRestored(item) {
    setItems((prev) => [item, ...prev]);
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <Spinner size={28} className="text-steel" />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onAuthenticated={setUser} />;
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-steel safe-top sticky top-0 z-20 shadow-sm">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-2.5">
          <Logo size={32} />
          <h1 className="font-display font-extrabold text-2xl text-cream tracking-tight">
            Threadii
          </h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-5 pb-28">
        {loading ? (
          <SkeletonGrid />
        ) : (
          <div key={tab} className="animate-[tab-fade_0.18s_ease-out]">
            {tab === "closet" ? (
              <ClosetView
                items={items}
                onDelete={handleDelete}
                onEdit={setEditingItem}
                onToggleLaundry={handleToggleLaundry}
              />
            ) : tab === "outfits" ? (
              <OutfitSuggestions items={items} />
            ) : tab === "favorites" ? (
              <FavoritesGrid />
            ) : tab === "calendar" ? (
              <OutfitCalendar items={items} />
            ) : (
              <AccountTab
                user={user}
                items={items}
                onLogout={handleLogout}
                onOpenArchived={() => setArchivedSheetOpen(true)}
              />
            )}
          </div>
        )}
      </main>
      <style>{`
        @keyframes tab-fade {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {tab === "closet" && (
        <button
          onClick={() => setSheetOpen(true)}
          aria-label="Add item"
          className="fixed right-5 bottom-20 z-30 w-14 h-14 rounded-full bg-steel text-cream text-3xl leading-none flex items-center justify-center shadow-lg active:scale-95 transition-transform"
        >
          +
        </button>
      )}

      <BottomNav tab={tab} onChange={setTab} />

      {pendingDelete && (
        <UndoToast message={`Removed ${pendingDelete.item.name}`} onUndo={handleUndoDelete} />
      )}

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Add to closet">
        <AddSheetContent onAdded={handleAdded} onBulkAdded={handleBulkAdded} />
      </Sheet>

      <Sheet open={Boolean(editingItem)} onClose={() => setEditingItem(null)} title="Edit item">
        {editingItem && (
          <EditItemForm
            item={editingItem}
            onSaved={handleItemSaved}
            onDeleted={handleItemDeleted}
            onArchived={handleItemArchived}
          />
        )}
      </Sheet>

      <Sheet
        open={archivedSheetOpen}
        onClose={() => setArchivedSheetOpen(false)}
        title="Archived items"
      >
        <ArchivedItemsList onRestored={handleItemRestored} />
      </Sheet>
    </div>
  );
}
