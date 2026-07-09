export function PackageCardSkeleton() {
  return (
    <div className="flex animate-pulse flex-col">
      <div
        className="rounded-3xl bg-cream-100 ring-1 ring-black/5"
        style={{ aspectRatio: "4/5" }}
      />
      <div className="mt-6 space-y-3">
        <div className="h-6 w-3/4 rounded bg-cream-100" />
        <div className="h-3 w-1/2 rounded bg-cream-100" />
      </div>
    </div>
  );
}