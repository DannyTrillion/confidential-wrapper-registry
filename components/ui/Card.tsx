import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/**
 * Flat surface, Vercel-style: a solid background defined by a single crisp 1px
 * border — no glass, blur, sheen, or gradient. A barely-there shadow gives the
 * needed lift on light mode (near-invisible on dark, where the border carries it).
 */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative rounded-card border border-line bg-surface shadow-card",
        // Faint top-edge light — reads as instrument-panel depth on dark.
        "shadow-[inset_0_1px_0_rgb(255_255_255/0.03),0_1px_2px_rgb(0_0_0/0.04),0_8px_24px_-14px_rgb(0_0_0/0.30)]",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 py-4 border-b border-line", className)} {...props} />;
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 py-4", className)} {...props} />;
}
