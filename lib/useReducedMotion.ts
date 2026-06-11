"use client";

import { useEffect, useState } from "react";

/**
 * Tracks the user's reduced-motion preference. Every decorative animation in the
 * app (ciphertext cycling, hex-rain, aurora, cascade) honours this — motion is
 * an enhancement, never a requirement.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}
