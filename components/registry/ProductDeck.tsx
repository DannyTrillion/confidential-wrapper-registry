"use client";

import Link from "next/link";
import { type ReactNode } from "react";
import { useExplorerNetwork } from "@/components/NetworkContext";
import { getNetwork } from "@/lib/networks";
import { Card } from "@/components/ui/Card";

/**
 * jup.ag-style product deck: after the market list, each core flow gets one
 * module with a two-line header ("Do X · with Y"), one plain-English sentence,
 * and one action. No carousels, no competing feeds.
 */
export function ProductDeck() {
  const { chainId } = useExplorerNetwork();
  const net = getNetwork(chainId)!;

  return (
    <section className="mt-12 grid sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
      <DeckCard
        delay={0}
        title="Wrap to Go Private"
        kicker="with any active pair"
        body="Turn a public token into its confidential twin. From that moment, the amount you hold is encrypted onchain."
        cta="Pick a token"
        onClick={() =>
          document.getElementById("registry-table")?.scrollIntoView({ behavior: "smooth", block: "start" })
        }
        icon={
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
            <circle cx="7" cy="10" r="4.5" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="13" cy="10" r="4.5" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        }
      />
      <DeckCard
        delay={70}
        title="Reveal in One Signature"
        kicker="with your decrypt session"
        body="One free wallet signature unlocks every encrypted balance you hold — revealed client-side, visible only to you."
        cta="Open Portfolio"
        href="/portfolio"
        icon={
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
            <circle cx="7.5" cy="7.5" r="3.8" stroke="currentColor" strokeWidth="1.5" />
            <path d="m10.4 10.4 5 5M14 14l1.8-1.8M12.5 16l1.8-1.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        }
      />
      <DeckCard
        delay={140}
        title="Claim Test Tokens"
        kicker="with the Sepolia faucet"
        body={
          net.supportsFaucet
            ? "Free practice tokens, once per hour per token — everything you need to try the full wrap-and-reveal loop."
            : "Switch to Sepolia to mint free practice tokens and try the full wrap-and-reveal loop risk-free."
        }
        cta="Open the faucet"
        href="/faucet"
        icon={
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
            <path d="M10 3c3.1 3.8 5 6.3 5 8.5a5 5 0 0 1-10 0C5 9.3 6.9 6.8 10 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        }
      />
      <DeckCard
        delay={210}
        title="List Your Own Pair"
        kicker="with the open registry"
        body="The registry is extensible: verify any ERC-20 ↔ ERC-7984 pair and surface it here — onchain or as a local entry."
        cta="Add a pair"
        href="/developers#add-pair"
        icon={
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
            <path d="M10 4.5v11M4.5 10h11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        }
      />
    </section>
  );
}

function DeckCard({
  title,
  kicker,
  body,
  cta,
  href,
  onClick,
  icon,
  delay = 0,
}: {
  title: string;
  kicker: string;
  body: string;
  cta: string;
  href?: string;
  onClick?: () => void;
  icon: ReactNode;
  delay?: number;
}) {
  const action = (
    <span className="inline-flex items-center gap-1 text-13 font-medium text-ink-muted group-hover/deck:text-ink group-hover/deck:gap-1.5 transition-all">
      {cta}
      <span aria-hidden="true">→</span>
    </span>
  );

  const content = (
    <Card className="group/deck relative h-full p-5 flex flex-col gap-3 overflow-hidden transition-[border-color,transform,box-shadow] duration-250 ease-out hover:border-line-strong hover:-translate-y-1 hover:shadow-card-hover cursor-pointer">
      {/* Gradient top hairline — catches the eye without adding chrome. */}
      <span
        className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-elevate/25 to-transparent opacity-60 group-hover/deck:via-accent/40 group-hover/deck:opacity-100 transition-all duration-300"
        aria-hidden="true"
      />
      {/* Cursor-tracked spotlight (position set by the wrapper's onMouseMove). */}
      <span
        className="pointer-events-none absolute inset-0 opacity-0 group-hover/deck:opacity-100 transition-opacity duration-300"
        style={{
          background:
            "radial-gradient(240px circle at var(--mx, 50%) var(--my, 20%), rgb(var(--overlay) / 0.055), transparent 70%)",
        }}
        aria-hidden="true"
      />
      {/* Ghosted watermark glyph — depth, not noise. */}
      <span
        className="pointer-events-none absolute -bottom-7 -right-5 opacity-[0.05] rotate-12 transition-all duration-300 ease-out group-hover/deck:opacity-[0.09] group-hover/deck:rotate-6 [&>svg]:h-28 [&>svg]:w-28 text-ink"
        aria-hidden="true"
      >
        {icon}
      </span>

      <span
        className="relative grid place-items-center h-10 w-10 rounded-input bg-raised border border-line text-ink-muted transition-all duration-250 ease-out group-hover/deck:scale-110 group-hover/deck:-rotate-3 group-hover/deck:border-accent/30 group-hover/deck:text-accentInk"
        aria-hidden="true"
      >
        {icon}
      </span>
      <div className="relative">
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        <p className="mt-0.5 font-mono text-2xs text-ink-ghost">{kicker}</p>
      </div>
      <p className="relative text-13 text-ink-faint leading-relaxed">{body}</p>
      <div className="relative mt-auto pt-1">{action}</div>
    </Card>
  );

  const entrance = { animationDelay: `${delay}ms` };
  const trackSpotlight = (e: React.MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
  if (href) {
    return (
      <Link href={href} style={entrance} onMouseMove={trackSpotlight} className="block animate-rise-in focus-visible:ring-2 focus-visible:ring-accent rounded-card">
        {content}
      </Link>
    );
  }
  return (
    <button onClick={onClick} style={entrance} onMouseMove={trackSpotlight} className="block text-left animate-rise-in focus-visible:ring-2 focus-visible:ring-accent rounded-card">
      {content}
    </button>
  );
}
