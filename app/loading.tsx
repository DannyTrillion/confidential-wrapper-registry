import { Skeleton } from "@/components/ui/Skeleton";

/** Route-transition skeleton — generic page shape (header + content card). */
export default function Loading() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading page">
      <div>
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-3 h-8 w-64 block" />
        <Skeleton className="mt-2.5 h-4 w-96 max-w-full block" />
      </div>
      <div className="rounded-card border border-line bg-surface p-4 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-8 w-8 !rounded-pill" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-40 block" />
              <Skeleton className="h-2.5 w-56 max-w-full block" />
            </div>
            <Skeleton className="h-8 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
