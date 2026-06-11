"use client";

import { useLayoutEffect, type RefObject } from "react";
import { useRef } from "react";

/**
 * FLIP: when the list changes, smoothly slide surviving rows from their old
 * position to their new one, so removing/adding rows never makes the table jump.
 * Entrances are left to CSS (rise-in); this only animates position shifts of rows
 * that persist. Honours reduced-motion. Tag each row with `data-flip="<key>"`.
 */
export function useFlip(ref: RefObject<HTMLElement | null>, deps: unknown[]) {
  const prev = useRef<Map<string, number>>(new Map());

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const nodes = el.querySelectorAll<HTMLElement>("[data-flip]");
    const next = new Map<string, number>();
    nodes.forEach((n) => next.set(n.dataset.flip as string, n.getBoundingClientRect().top));

    if (!reduced) {
      nodes.forEach((n) => {
        const key = n.dataset.flip as string;
        const before = prev.current.get(key);
        const after = next.get(key) as number;
        if (before !== undefined && before !== after) {
          n.animate(
            [{ transform: `translateY(${before - after}px)` }, { transform: "translateY(0)" }],
            { duration: 240, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
          );
        }
      });
    }
    prev.current = next;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
