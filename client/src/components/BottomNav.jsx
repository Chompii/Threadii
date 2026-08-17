const TABS = [
  { key: "closet", label: "Closet", icon: ClosetIcon },
  { key: "outfits", label: "Outfits", icon: OutfitsIcon },
  { key: "favorites", label: "Favorites", icon: FavoritesIcon },
  { key: "calendar", label: "Plan", icon: CalendarIcon },
  { key: "account", label: "Account", icon: AccountIcon },
];

function ClosetIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M9 3l3 2 3-2 4 3-2.5 2.5L18 10v9a1 1 0 01-1 1H7a1 1 0 01-1-1v-9l1.5-1.5L5 6l4-3z"
        stroke={active ? "#3D6A85" : "#8A6F52"}
        strokeWidth="1.6"
        strokeLinejoin="round"
        fill={active ? "#3D6A8522" : "none"}
      />
    </svg>
  );
}

function OutfitsIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect
        x="4"
        y="3"
        width="7"
        height="9"
        rx="1.4"
        stroke={active ? "#3D6A85" : "#8A6F52"}
        strokeWidth="1.6"
        fill={active ? "#3D6A8522" : "none"}
      />
      <rect
        x="13"
        y="3"
        width="7"
        height="6"
        rx="1.4"
        stroke={active ? "#3D6A85" : "#8A6F52"}
        strokeWidth="1.6"
        fill={active ? "#3D6A8522" : "none"}
      />
      <rect
        x="13"
        y="11"
        width="7"
        height="10"
        rx="1.4"
        stroke={active ? "#3D6A85" : "#8A6F52"}
        strokeWidth="1.6"
        fill={active ? "#3D6A8522" : "none"}
      />
      <rect
        x="4"
        y="14"
        width="7"
        height="7"
        rx="1.4"
        stroke={active ? "#3D6A85" : "#8A6F52"}
        strokeWidth="1.6"
        fill={active ? "#3D6A8522" : "none"}
      />
    </svg>
  );
}

function FavoritesIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24">
      <path
        d="M12 20.5s-7.5-4.6-10-9.3C.5 7.8 2.3 4.5 5.6 4.1c1.9-.2 3.7.8 4.9 2.4a.6.6 0 001 0c1.2-1.6 3-2.6 4.9-2.4 3.3.4 5.1 3.7 3.6 7.1-2.5 4.7-10 9.3-10 9.3z"
        fill={active ? "#3D6A8522" : "none"}
        stroke={active ? "#3D6A85" : "#8A6F52"}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CalendarIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect
        x="3.5"
        y="5"
        width="17"
        height="15.5"
        rx="2"
        stroke={active ? "#3D6A85" : "#8A6F52"}
        strokeWidth="1.6"
        fill={active ? "#3D6A8522" : "none"}
      />
      <path d="M3.5 9.5h17" stroke={active ? "#3D6A85" : "#8A6F52"} strokeWidth="1.6" />
      <path d="M8 3v4M16 3v4" stroke={active ? "#3D6A85" : "#8A6F52"} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function AccountIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle
        cx="12"
        cy="8"
        r="3.6"
        stroke={active ? "#3D6A85" : "#8A6F52"}
        strokeWidth="1.6"
        fill={active ? "#3D6A8522" : "none"}
      />
      <path
        d="M4.5 20c1.4-3.6 4.6-5.5 7.5-5.5s6.1 1.9 7.5 5.5"
        stroke={active ? "#3D6A85" : "#8A6F52"}
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export default function BottomNav({ tab, onChange }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 bg-cream/95 backdrop-blur border-t border-taupe/15 safe-bottom">
      <div className="max-w-md mx-auto grid grid-cols-5">
        {TABS.map(({ key, label, icon: Icon }) => {
          const active = tab === key;
          return (
            <button
              key={key}
              onClick={() => onChange(key)}
              className="flex flex-col items-center gap-1 py-2.5"
            >
              <Icon active={active} />
              <span
                className={`text-[11px] font-body ${active ? "text-steel font-bold" : "text-taupe"}`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
