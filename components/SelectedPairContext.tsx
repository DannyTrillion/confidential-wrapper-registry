"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { EnrichedPair } from "@/lib/registry/types";

interface Ctx {
  selected: EnrichedPair | null;
  setSelected: (p: EnrichedPair | null) => void;
}

const SelectedPairContext = createContext<Ctx | null>(null);

/** Shared "currently-focused pair" so the registry table can populate the
 *  right context rail without navigating away (terminal-style). */
export function SelectedPairProvider({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState<EnrichedPair | null>(null);
  return (
    <SelectedPairContext.Provider value={{ selected, setSelected }}>
      {children}
    </SelectedPairContext.Provider>
  );
}

export function useSelectedPair(): Ctx {
  const ctx = useContext(SelectedPairContext);
  // Rail lives inside the provider; components outside (rare) get a no-op.
  return ctx ?? { selected: null, setSelected: () => {} };
}
