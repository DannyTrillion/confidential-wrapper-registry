"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/cn";
import { truncateAddress } from "@/lib/format";
import { explorerAddressUrl } from "@/lib/networks";

/** Copy-on-click icon button. Shows a brief check on success. */
export function CopyButton({
  value,
  label,
  className,
  onCopied,
}: {
  value: string;
  label?: string;
  className?: string;
  onCopied?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      onCopied?.();
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* clipboard blocked — no-op */
    }
  }, [value, onCopied]);

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={label ?? `Copy ${value}`}
      title={copied ? "Copied" : "Copy"}
      className={cn(
        "inline-grid place-items-center h-5 w-5 rounded-[4px] text-ink-faint",
        "hover:text-ink hover:bg-raised transition-colors duration-150",
        className,
      )}
    >
      {copied ? (
        <svg viewBox="0 0 14 14" className="h-3 w-3 text-ok" fill="none" aria-hidden="true">
          <path d="M2.5 7.5 6 11l5.5-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg viewBox="0 0 14 14" className="h-3 w-3" fill="none" aria-hidden="true">
          <rect x="3.25" y="3.25" width="7.5" height="7.5" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
          <path d="M2 9V2.5A1.5 1.5 0 0 1 3.5 1H9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      )}
    </button>
  );
}

function ExplorerLink({ href, label }: { href: string; label?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label ?? "View on block explorer"}
      title="View on explorer"
      className="inline-grid place-items-center h-5 w-5 rounded-[4px] text-ink-faint hover:text-accent hover:bg-raised transition-colors duration-150"
    >
      <svg viewBox="0 0 14 14" className="h-3 w-3" fill="none" aria-hidden="true">
        <path d="M5.5 2.5H3A1.5 1.5 0 0 0 1.5 4v7A1.5 1.5 0 0 0 3 12.5h7A1.5 1.5 0 0 0 11.5 11V8.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M8 2.5h4v4M12 2.5 6.5 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </a>
  );
}

/**
 * The canonical address chip: truncated-middle mono text + copy + explorer link.
 * Used everywhere an address appears (DESIGN.md).
 */
export function Address({
  address,
  chainId,
  lead = 6,
  tail = 4,
  className,
  mono = true,
}: {
  address: string;
  chainId?: number;
  lead?: number;
  tail?: number;
  className?: string;
  mono?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <span className={cn(mono && "font-mono", "text-13 text-ink-muted")} title={address}>
        {truncateAddress(address, lead, tail)}
      </span>
      <CopyButton value={address} />
      {chainId != null && <ExplorerLink href={explorerAddressUrl(chainId, address)} />}
    </span>
  );
}
