"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

export interface GuidePoint {
  label: string;
  body: ReactNode;
}

/**
 * Per-page "how this works" guide — a collapsible glass card with numbered
 * steps specific to the screen. Default open; remembers the collapsed state per
 * `id` so a returning user isn't re-taught.
 */
export function PageGuide({
  id,
  title = "How this works",
  intro,
  points,
}: {
  id: string;
  title?: string;
  intro?: ReactNode;
  points: GuidePoint[];
}) {
  const [open, setOpen] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setOpen(window.localStorage.getItem(`guide:${id}`) !== "collapsed");
    setReady(true);
  }, [id]);

  function toggle() {
    const next = !open;
    setOpen(next);
    window.localStorage.setItem(`guide:${id}`, next ? "open" : "collapsed");
  }

  return (
    <Card className="overflow-hidden">
      <button
        onClick={toggle}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-13 font-medium text-ink">
          <span className="grid place-items-center h-5 w-5 rounded-pill bg-accent/15 text-accent">
            <svg viewBox="0 0 14 14" className="h-3 w-3" fill="none" aria-hidden="true">
              <circle cx="7" cy="7" r="5.4" stroke="currentColor" strokeWidth="1.2" />
              <path d="M7 6.3v3.2M7 4.5h.01" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </span>
          {title}
        </span>
        <svg
          viewBox="0 0 14 14"
          className={cn("h-3.5 w-3.5 text-ink-faint transition-transform duration-200", open && "rotate-180")}
          fill="none"
          aria-hidden="true"
        >
          <path d="m3.5 5 3.5 3.5L10.5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {ready && open && (
        <div className="px-4 pb-4 animate-rise-in">
          {intro && <p className="text-13 text-ink-faint leading-relaxed mb-3 max-w-3xl">{intro}</p>}
          <ol className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {points.map((p, i) => (
              <li key={i} className="rounded-input border border-line glass-soft px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="grid place-items-center h-5 w-5 rounded-pill border border-accent/30 bg-accent-faint text-2xs font-mono text-accent">
                    {i + 1}
                  </span>
                  <span className="text-13 font-medium text-ink">{p.label}</span>
                </div>
                <p className="mt-1.5 text-2xs text-ink-faint leading-relaxed">{p.body}</p>
              </li>
            ))}
          </ol>
        </div>
      )}
    </Card>
  );
}
