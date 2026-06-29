"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { tokenLogo, tokenMonogram } from "@/lib/tokenLogo";

/**
 * Flat, crisp token icon: the token's real logo in a clean circular badge, or a
 * deterministic ticker monogram when no official logo exists. Static by default;
 * inside a `.group/token` row it gently lifts on hover (scale + soft ring) — a
 * quiet touch, no spinning.
 */
export function TokenIcon({
  symbol,
  confidential,
  size = 32,
  className,
}: {
  symbol?: string;
  confidential?: boolean;
  size?: number;
  className?: string;
}) {
  const logo = tokenLogo(symbol);
  const [imgOk, setImgOk] = useState(true);
  const showLogo = !!logo && imgOk;

  return (
    <span
      className={cn(
        "relative grid place-items-center shrink-0 rounded-full border overflow-hidden transition duration-200 group-hover/token:scale-110",
        confidential
          ? "border-accent/30 bg-accent-faint group-hover/token:ring-2 group-hover/token:ring-accent/25"
          : "border-line bg-raised group-hover/token:ring-2 group-hover/token:ring-elevate/15",
        className,
      )}
      style={{ width: size, height: size }}
      title={confidential ? "ERC-7984 confidential wrapper" : "ERC-20 underlying"}
    >
      {showLogo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logo!}
          alt=""
          onError={() => setImgOk(false)}
          className="object-contain"
          style={{ width: size * 0.66, height: size * 0.66, opacity: confidential ? 0.95 : 1 }}
        />
      ) : (
        <span
          className={cn("font-mono font-semibold tracking-tight leading-none", confidential ? "text-accentInk" : "text-ink-muted")}
          style={{ fontSize: Math.max(7, size * 0.3) }}
        >
          {tokenMonogram(symbol)}
        </span>
      )}
      {confidential && (
        <span className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-accent/20" aria-hidden="true" />
      )}
    </span>
  );
}
