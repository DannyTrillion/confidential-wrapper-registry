"use client";

import { useLayoutEffect, useState, type RefObject } from "react";

export interface ActiveRect {
  left: number;
  top: number;
  width: number;
  height: number;
  visible: boolean;
}

/**
 * Measures the box of the `[data-active="true"]` child inside `containerRef`,
 * relative to the container. Lets a single indicator (sidebar bar, tab underline)
 * slide smoothly between items instead of snapping per-item. The container must
 * be `position: relative`.
 */
export function useActiveRect(containerRef: RefObject<HTMLElement | null>, deps: unknown[]): ActiveRect {
  const [rect, setRect] = useState<ActiveRect>({ left: 0, top: 0, width: 0, height: 0, visible: false });

  useLayoutEffect(() => {
    const c = containerRef.current;
    if (!c) return;
    const el = c.querySelector<HTMLElement>('[data-active="true"]');
    if (el) {
      setRect({ left: el.offsetLeft, top: el.offsetTop, width: el.offsetWidth, height: el.offsetHeight, visible: true });
    } else {
      setRect((r) => ({ ...r, visible: false }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return rect;
}
