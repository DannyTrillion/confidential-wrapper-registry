import { cn } from "@/lib/cn";

/** Skeleton block — fixed dimensions, never causes layout shift. */
export function Skeleton({ className }: { className?: string }) {
  return <span className={cn("skeleton inline-block align-middle", className)} aria-hidden="true" />;
}
