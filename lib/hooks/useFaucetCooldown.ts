"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Client-side per-address faucet rate limit. The mock ERC-20 `mint` has no
 * on-chain limit, so we enforce a cooldown per (chain, token, address) in
 * localStorage and surface a live countdown. This is intentionally honest:
 * it's a courtesy limiter, not a security boundary.
 */
const COOLDOWN_SECONDS = 60 * 60; // 1 hour per address per token

function storageKey(chainId: number, token: string, address: string) {
  return `faucet:${chainId}:${token.toLowerCase()}:${address.toLowerCase()}`;
}

export function useFaucetCooldown(chainId: number, token: string, address?: string) {
  const [remaining, setRemaining] = useState(0);

  const read = useCallback(() => {
    if (!address || typeof window === "undefined") return 0;
    const raw = window.localStorage.getItem(storageKey(chainId, token, address));
    if (!raw) return 0;
    const last = Number(raw);
    if (!Number.isFinite(last)) return 0;
    const elapsed = (Date.now() - last) / 1000;
    return Math.max(0, Math.ceil(COOLDOWN_SECONDS - elapsed));
  }, [chainId, token, address]);

  useEffect(() => {
    setRemaining(read());
    const id = setInterval(() => setRemaining(read()), 1000);
    return () => clearInterval(id);
  }, [read]);

  const markClaimed = useCallback(() => {
    if (!address || typeof window === "undefined") return;
    window.localStorage.setItem(storageKey(chainId, token, address), String(Date.now()));
    setRemaining(COOLDOWN_SECONDS);
  }, [chainId, token, address]);

  return { remaining, markClaimed, cooldownSeconds: COOLDOWN_SECONDS };
}

export function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    return `${h}h ${m % 60}m`;
  }
  return `${m}m ${String(s).padStart(2, "0")}s`;
}
