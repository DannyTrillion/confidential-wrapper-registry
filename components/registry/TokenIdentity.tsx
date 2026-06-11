"use client";

import { cn } from "@/lib/cn";
import type { TokenMeta } from "@/lib/registry/types";
import { truncateAddress } from "@/lib/format";
import { TokenIcon } from "@/components/fx/TokenIcon";

/**
 * Token identity cell: the token's real logo (or a ticker monogram if none
 * exists) in a clean circular badge, with symbol + name beside it. The whole
 * cell is a hover group, so the icon gives a subtle lift on hover.
 */
export function TokenIdentity({
  meta,
  address,
  confidential,
  className,
}: {
  meta: TokenMeta;
  address: string;
  confidential?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("group/token flex items-center gap-2.5 min-w-0", className)}>
      <TokenIcon symbol={meta.symbol} confidential={confidential} size={32} />
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-13 text-ink truncate">
            {meta.symbol ?? truncateAddress(address)}
          </span>
        </div>
        <div className="text-2xs text-ink-faint truncate leading-tight">
          {meta.name ?? (meta.resolved ? "—" : "Unresolved metadata")}
        </div>
      </div>
    </div>
  );
}
