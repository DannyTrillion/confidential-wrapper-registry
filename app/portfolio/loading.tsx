import { Skeleton } from "@/components/ui/Skeleton";

/** Portfolio route skeleton — mirrors the dashboard shape (header, band, rows). */
export default function Loading() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading portfolio">
      {/* Account header */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 !rounded-pill" />
        <Skeleton className="h-9 w-40" />
        <div className="ml-auto flex gap-1.5">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-9" />
        </div>
      </div>

      {/* Top band */}
      <div className="grid lg:grid-cols-[minmax(0,1fr)_340px] gap-3.5">
        <div className="rounded-card border border-line bg-surface p-5">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="mt-3 h-9 w-44 block" />
          <div className="mt-4 flex gap-8">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
          </div>
          <Skeleton className="mt-5 h-10 w-48 block" />
        </div>
        <div className="rounded-card border border-line bg-surface p-5">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="mt-4 h-16 w-full block" />
        </div>
      </div>

      {/* Tabs + rows */}
      <div className="flex gap-1.5">
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="rounded-card border border-line bg-surface">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={`flex items-center gap-4 px-4 py-3.5 ${i > 0 ? "border-t border-line" : ""}`}>
            <Skeleton className="h-8 w-8 !rounded-pill" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-24 block" />
              <Skeleton className="h-2.5 w-32 block" />
            </div>
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
