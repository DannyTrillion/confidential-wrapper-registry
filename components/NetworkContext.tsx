"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { DEFAULT_CHAIN_ID, NETWORKS, type SupportedChainId } from "@/lib/networks";

interface NetworkCtx {
  /** The network the explorer is browsing — independent of the connected wallet. */
  chainId: SupportedChainId;
  setChainId: (id: SupportedChainId) => void;
}

const Ctx = createContext<NetworkCtx | null>(null);
const STORAGE_KEY = "wr:explorer-chain";

export function ExplorerNetworkProvider({ children }: { children: ReactNode }) {
  // Start from the default so server and first client render match (no hydration
  // mismatch); restore the persisted choice right after mount.
  const [chainId, setChainIdState] = useState<SupportedChainId>(DEFAULT_CHAIN_ID);

  useEffect(() => {
    try {
      const saved = Number(window.localStorage.getItem(STORAGE_KEY));
      if (saved && saved !== chainId && saved in NETWORKS) setChainIdState(saved as SupportedChainId);
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setChainId = useCallback((id: SupportedChainId) => {
    setChainIdState(id);
    try {
      window.localStorage.setItem(STORAGE_KEY, String(id));
    } catch {
      /* ignore */
    }
  }, []);

  return <Ctx.Provider value={{ chainId, setChainId }}>{children}</Ctx.Provider>;
}

export function useExplorerNetwork(): NetworkCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useExplorerNetwork must be used within ExplorerNetworkProvider");
  return ctx;
}

export const EXPLORER_NETWORKS = Object.values(NETWORKS);
