"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { getSessionInfo, subscribeDecryptSessions, type SessionInfo } from "@/lib/fhevm/useDecryptSession";

/**
 * Surfaces the "you signed once" decryption session. Appears only after the
 * user establishes a session, reinforcing that further decrypts are free.
 */
export function SessionChip() {
  const { address, chainId } = useAccount();
  const [info, setInfo] = useState<SessionInfo>({ active: false, daysLeft: 0 });

  useEffect(() => {
    const update = () => setInfo(getSessionInfo(chainId, address));
    update();
    const unsub = subscribeDecryptSessions(update);
    // Re-evaluate periodically so the day-counter and expiry stay honest.
    const id = setInterval(update, 30_000);
    return () => {
      unsub();
      clearInterval(id);
    };
  }, [address, chainId]);

  if (!info.active) return null;

  return (
    <span
      className="hidden sm:inline-flex items-center gap-1.5 h-8 px-2.5 rounded-input border border-accent/25 bg-accent-faint text-2xs font-medium text-accent"
      title={`Decryption session active — expires in ${info.daysLeft} day${info.daysLeft === 1 ? "" : "s"}`}
    >
      <svg viewBox="0 0 14 14" className="h-3 w-3" fill="none" aria-hidden="true">
        <rect x="3" y="6.5" width="8" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.2" />
        <path d="M4.75 6.5V5a2.25 2.25 0 0 1 4.4-.6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
      Session · {info.daysLeft}d
    </span>
  );
}
