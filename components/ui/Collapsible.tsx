"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Collapsible used for raw error details — collapsed by default. */
export function Collapsible({ summary, children }: { summary: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-input border border-line glass-soft">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-2xs text-ink-faint hover:text-ink-muted transition-colors"
        aria-expanded={open}
      >
        <span>{summary}</span>
        <svg
          viewBox="0 0 12 12"
          className={cn("h-3 w-3 transition-transform duration-150", open && "rotate-180")}
          fill="none"
          aria-hidden="true"
        >
          <path d="m3 4.5 3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <pre className="px-3 pb-3 pt-0 text-2xs font-mono text-ink-faint whitespace-pre-wrap break-words max-h-48 overflow-auto">
          {children}
        </pre>
      )}
    </div>
  );
}
