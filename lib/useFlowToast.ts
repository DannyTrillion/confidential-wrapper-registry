"use client";

import { useEffect, useRef } from "react";
import { useToast } from "@/components/ui/Toast";
import { useTxResult } from "@/components/ui/TxResult";
import type { FlowState } from "./useActionFlow";

/**
 * Mirrors an action flow into the global feedback surfaces: while a run is
 * pending it narrates step text in a corner toast; the moment it settles, the
 * toast steps aside and a center-screen result popup takes over — a celebratory
 * burst on success, a shake on failure. One run = one toast id + one popup.
 */
export function useFlowToast(
  state: FlowState,
  opts: { label: string; chainId?: number; txHash?: string },
) {
  const toast = useToast();
  const txResult = useTxResult();
  const idRef = useRef<string | null>(null);

  useEffect(() => {
    if (state.status === "idle") return;
    if (!idRef.current) idRef.current = `flow-${Math.random().toString(36).slice(2)}`;
    const id = idRef.current;

    if (state.status === "pending") {
      toast.upsert(id, { status: "pending", title: opts.label, message: state.step ?? undefined });
    } else if (state.status === "success") {
      toast.dismiss(id);
      txResult.show({
        status: "success",
        title: opts.label,
        message: state.message ?? undefined,
        txHash: opts.txHash,
        chainId: opts.chainId,
      });
      idRef.current = null;
    } else if (state.status === "error") {
      toast.dismiss(id);
      txResult.show({
        status: "error",
        title: `${opts.label} failed`,
        message: state.message ?? undefined,
        raw: state.raw,
      });
      idRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status, state.step, state.message, opts.txHash]);
}
