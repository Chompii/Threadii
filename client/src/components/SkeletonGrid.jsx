function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-taupe/15 overflow-hidden shadow-sm animate-pulse">
      <div className="aspect-square bg-taupe/10" />
      <div className="p-2.5 space-y-2">
        <div className="h-3.5 bg-taupe/15 rounded w-3/4" />
        <div className="h-2.5 bg-taupe/10 rounded w-1/2" />
      </div>
    </div>
  );
}

export default function SkeletonGrid({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonRows({ count = 2 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl border border-taupe/15 p-4 shadow-sm space-y-3 animate-pulse"
        >
          <div className="flex items-center justify-between">
            <div className="h-4 bg-taupe/15 rounded w-1/3" />
            <div className="h-5 bg-taupe/10 rounded-full w-20" />
          </div>
          <div className="flex gap-2">
            <div className="flex-1 aspect-square rounded-xl bg-taupe/10" />
            <div className="flex-1 aspect-square rounded-xl bg-taupe/10" />
          </div>
        </div>
      ))}
    </div>
  );
}
