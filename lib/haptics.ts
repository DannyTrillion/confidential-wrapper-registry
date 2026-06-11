/**
 * Sound-free haptics for touch devices. No-ops where unsupported (desktop,
 * SSR, browsers without the Vibration API) and respects reduced-motion as a
 * proxy for "minimize non-essential feedback". Patterns are intentionally tiny.
 */
type Pattern = number | number[];

function enabled(): boolean {
  if (typeof window === "undefined" || !("vibrate" in navigator)) return false;
  return !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

export function haptic(pattern: Pattern) {
  if (!enabled()) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    /* ignore */
  }
}

export const haptics = {
  /** A light tap — button press. */
  tap: () => haptic(6),
  /** A confirming double-pulse — success. */
  success: () => haptic([10, 40, 14]),
  /** A single longer buzz — error. */
  error: () => haptic(36),
};
