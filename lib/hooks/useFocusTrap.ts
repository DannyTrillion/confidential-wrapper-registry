"use client";

import { useEffect, type RefObject } from "react";

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * Traps keyboard focus inside `ref` while `active`, and restores focus to the
 * previously-focused element on deactivate. Scoped to focus only — Escape,
 * scroll-lock, and arrow-key nav stay with each overlay so this composes
 * cleanly with dialogs that already handle those. The container should be
 * `tabIndex={-1}` so it can receive focus when it has no focusable children.
 */
export function useFocusTrap(active: boolean, ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!active) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const node = ref.current;

    const focusables = () => Array.from(node?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
    const id = requestAnimationFrame(() => {
      // Don't steal focus if something inside is already focused (e.g. an
      // input the component focused itself).
      if (node && !node.contains(document.activeElement)) (focusables()[0] ?? node).focus();
    });

    function onKey(e: KeyboardEvent) {
      if (e.key !== "Tab" || !node) return;
      const list = focusables();
      if (list.length === 0) {
        e.preventDefault();
        node.focus();
        return;
      }
      const idx = list.indexOf(document.activeElement as HTMLElement);
      if (e.shiftKey && idx <= 0) {
        e.preventDefault();
        list[list.length - 1].focus();
      } else if (!e.shiftKey && idx === list.length - 1) {
        e.preventDefault();
        list[0].focus();
      }
    }

    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(id);
      document.removeEventListener("keydown", onKey);
      previouslyFocused?.focus?.();
    };
  }, [active, ref]);
}
