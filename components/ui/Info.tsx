"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Inline "?" explainer. Hover or focus reveals a short plain-language note —
 * used to demystify FHE jargon (handle, rate, two-phase unwrap, user-decrypt)
 * right where it appears. Keyboard-accessible.
 */
export function Info({ children, className, side = "top" }: { children: ReactNode; className?: string; side?: "top" | "bottom" }) {
  return (
    <span className={cn("relative inline-flex group align-middle", className)}>
      <button
        type="button"
        aria-label="More information"
        className="grid place-items-center h-3.5 w-3.5 rounded-pill border border-line text-[9px] font-medium text-ink-faint hover:text-ink hover:border-line-strong focus-visible:ring-2 focus-visible:ring-accent transition-colors"
      >
        ?
      </button>
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute left-1/2 -translate-x-1/2 z-50 w-56 rounded-input border border-line-strong bg-raised px-3 py-2",
          "text-2xs leading-relaxed text-ink-muted shadow-none opacity-0 translate-y-1",
          "transition-all duration-150 group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0",
          side === "top" ? "bottom-full mb-1.5" : "top-full mt-1.5",
        )}
      >
        {children}
      </span>
    </span>
  );
}
