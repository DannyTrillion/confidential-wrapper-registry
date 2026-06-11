"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Unwrap is two-phase: the burn happens first, then `finalizeUnwrap` releases
 * the ERC-20. If the second phase fails (relayer hiccup, rejected signature),
 * the burn is already on-chain. We persist the pending request so the user can
 * always resume and complete the withdrawal — funds are never stranded.
 */
export interface PendingUnwrap {
  requestId: string;
  handle: string;
  createdAt: number;
}

function storageKey(chainId: number, wrapper: string, user: string) {
  return `pending-unwrap:${chainId}:${wrapper.toLowerCase()}:${user.toLowerCase()}`;
}

export function usePendingUnwrap(chainId: number, wrapper: string, user?: string) {
  const [pending, setPending] = useState<PendingUnwrap | null>(null);

  const read = useCallback((): PendingUnwrap | null => {
    if (!user || typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(storageKey(chainId, wrapper, user));
    if (!raw) return null;
    try {
      return JSON.parse(raw) as PendingUnwrap;
    } catch {
      return null;
    }
  }, [chainId, wrapper, user]);

  useEffect(() => {
    setPending(read());
  }, [read]);

  const save = useCallback(
    (p: PendingUnwrap) => {
      if (!user) return;
      window.localStorage.setItem(storageKey(chainId, wrapper, user), JSON.stringify(p));
      setPending(p);
    },
    [chainId, wrapper, user],
  );

  const clear = useCallback(() => {
    if (!user) return;
    window.localStorage.removeItem(storageKey(chainId, wrapper, user));
    setPending(null);
  }, [chainId, wrapper, user]);

  return { pending, save, clear };
}
