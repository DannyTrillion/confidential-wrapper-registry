"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { useState, useRef, useEffect } from "react";
import { Button } from "./Button";
import { truncateAddress } from "@/lib/format";
import { isSupportedChain, explorerAddressUrl } from "@/lib/networks";
import { cn } from "@/lib/cn";

export function ConnectButton() {
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (!isConnected || !address) {
    // One connector → connect directly; multiple → show a small picker.
    if (connectors.length <= 1) {
      return (
        <Button
          variant="primary"
          size="sm"
          loading={isPending}
          onClick={() => connectors[0] && connect({ connector: connectors[0] })}
          className="btn-sheen group/connect gap-2 pl-3 hover:-translate-y-px transition-transform"
        >
          {!isPending && <WalletGlyph />}
          {isPending ? "Connecting…" : (
            <>
              Connect<span className="hidden xs:inline">&nbsp;Wallet</span>
            </>
          )}
        </Button>
      );
    }
    return (
      <div className="relative" ref={ref}>
        <Button
          variant="primary"
          size="sm"
          loading={isPending}
          onClick={() => setOpen((v) => !v)}
          className="btn-sheen group/connect gap-2 pl-3 hover:-translate-y-px transition-transform"
        >
          {!isPending && <WalletGlyph />}
          {isPending ? "Connecting…" : (
            <>
              Connect<span className="hidden xs:inline">&nbsp;Wallet</span>
            </>
          )}
        </Button>
        {open && (
          <div className="absolute right-0 mt-2 w-52 rounded-card border border-line bg-surface p-1 animate-fade-in z-50">
            <div className="px-2.5 pt-2 pb-1 text-2xs uppercase tracking-wide text-ink-ghost">Choose a wallet</div>
            {connectors.map((c) => (
              <button
                key={c.uid}
                onClick={() => {
                  connect({ connector: c });
                  setOpen(false);
                }}
                className="w-full text-left px-2.5 py-2 rounded-[8px] text-13 text-ink-muted hover:text-ink hover:bg-raised transition-colors"
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  const unsupported = !isSupportedChain(chainId);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex items-center gap-2 h-8 pl-2.5 pr-2 rounded-input border text-13 font-mono",
          "transition-colors duration-150",
          unsupported
            ? "border-danger/30 text-danger bg-danger/5 hover:bg-danger/10"
            : "border-line text-ink bg-raised hover:border-line-strong",
        )}
      >
        <span className="relative flex h-2 w-2" aria-hidden="true">
          {!unsupported && (
            <span className="absolute inline-flex h-full w-full rounded-pill bg-accent/50 animate-[ping_2.4s_ease-out_infinite]" />
          )}
          <span className={cn("relative h-2 w-2 rounded-pill", unsupported ? "bg-danger" : "bg-accent")} />
        </span>
        {truncateAddress(address)}
        <svg viewBox="0 0 12 12" className="h-3 w-3 text-ink-faint" fill="none" aria-hidden="true">
          <path d="m3 4.5 3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-card border border-line bg-surface p-1 animate-fade-in z-50">
          {chainId && isSupportedChain(chainId) && (
            <a
              href={explorerAddressUrl(chainId, address)}
              target="_blank"
              rel="noopener noreferrer"
              className="block px-3 py-2 rounded-[6px] text-13 text-ink-muted hover:text-ink hover:bg-raised transition-colors"
            >
              View on explorer ↗
            </a>
          )}
          <button
            onClick={() => {
              navigator.clipboard?.writeText(address);
              setOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-[6px] text-13 text-ink-muted hover:text-ink hover:bg-raised transition-colors"
          >
            Copy address
          </button>
          <div className="my-1 h-px bg-line" />
          <button
            onClick={() => {
              disconnect();
              setOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-[6px] text-13 text-danger hover:bg-danger/10 transition-colors"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}

/** Tiny wallet glyph — nudges toward the label on hover. */
function WalletGlyph() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="h-3.5 w-3.5 text-[#0a0a0a]/70 transition-transform duration-200 ease-out group-hover/connect:translate-x-0.5 group-hover/connect:text-[#0a0a0a]"
      fill="none"
      aria-hidden="true"
    >
      <rect x="1.8" y="3.8" width="12.4" height="9" rx="2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M10.5 8.3h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M3.5 3.8 10 2v1.8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
