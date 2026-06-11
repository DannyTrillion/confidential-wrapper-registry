import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/**
 * Frosted-glass surface. Translucent, top-lit, blurred backdrop so the ambient
 * aurora/hex field reads through for depth — with a soft top-left sheen and a
 * 1px top edge-light (glass, not shadow, per DESIGN.md). The sheen + tint live
 * in the element's own background, so they sit behind content and never clip
 * overflowing children (tooltips, menus).
 */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        // BlindPay glass: translucent white on pure black, top-left sheen,
        // blurred backdrop, 1px hairline + top edge-light.
        "relative rounded-card border border-line backdrop-blur-2xl",
        "bg-[radial-gradient(120%_80%_at_0%_0%,rgba(255,255,255,0.06),transparent_46%),linear-gradient(to_bottom,rgba(255,255,255,0.035),rgba(255,255,255,0.012))]",
        "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:rounded-t-card",
        "before:bg-gradient-to-r before:from-transparent before:via-white/[0.14] before:to-transparent",
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
