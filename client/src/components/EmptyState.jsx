export function HangerIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="4.2" r="1.4" stroke="#8A6F52" strokeWidth="1.4" />
      <path
        d="M12 5.6v1.8M3.5 20.5l7.6-6.2a1.4 1.4 0 011.8 0l7.6 6.2"
        stroke="#8A6F52"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path d="M2.5 20.5h19" stroke="#8A6F52" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export default function EmptyState({ icon, title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-taupe/35 p-10 text-center">
      {icon}
      <div className="space-y-1">
        <p className="font-body font-bold text-ink text-sm">{title}</p>
        {subtitle && <p className="font-caption text-taupe text-xs max-w-[220px]">{subtitle}</p>}
      </div>
    </div>
  );
}
