"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Mascot } from "@/components/onboarding/Mascot";
import { TOUR_START_EVENT } from "@/components/onboarding/OnboardingTour";
import { cn } from "@/lib/cn";

/**
 * The friendly Guide — what a confidential wrapper registry is, in plain words.
 * No prior crypto knowledge assumed; the precise terms appear in parentheses so
 * curious readers can connect them to the rest of the app.
 */
export function DocsView() {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <Card className="relative overflow-hidden p-6 sm:p-8">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-elevate/[0.06] to-transparent" />
        <div className="relative flex flex-col sm:flex-row items-start gap-5">
          <Mascot mood="wave" size={84} />
          <div>
            <div className="text-2xs uppercase tracking-[0.14em] text-ink">The Guide</div>
            <h1 className="mt-1.5 text-2xl sm:text-3xl font-semibold text-ink tracking-tight">
              What is a Confidential Wrapper Registry?
            </h1>
            <p className="mt-2.5 text-sm text-ink-muted leading-relaxed max-w-2xl">
              It&apos;s a place to turn ordinary tokens into <strong className="text-ink">confidential</strong> ones — so
              your balances and payments stay your business, while everything still runs on a public blockchain.
              This page explains the whole idea in plain English.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              <Link
                href="/"
                className="h-9 px-4 inline-flex items-center rounded-pill text-13 font-semibold bg-ink text-base hover:brightness-105 active:scale-[0.97] transition"
              >
                Browse the registry
              </Link>
              <button
                onClick={() => window.dispatchEvent(new Event(TOUR_START_EVENT))}
                className="h-9 px-4 inline-flex items-center rounded-pill text-13 font-medium text-ink-muted border border-line hover:border-line-strong hover:text-ink transition-colors"
              >
                Replay the tour
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Problem / fix */}
      <Section title="The problem with normal tokens">
        <div className="grid sm:grid-cols-2 gap-3">
          <MiniCard
            tone="plain"
            icon="eye"
            title="Everything is public"
            body="On a normal blockchain, anyone can look up exactly how much of a token you hold and every payment you've ever made. It's like your bank statement being posted online for the world to see."
          />
          <MiniCard
            tone="accent"
            icon="lock"
            title="The fix: keep the amount secret"
            body="A confidential token hides the amount. The blockchain still records that a balance exists and that a transfer happened — but the number itself is scrambled, and only you can unscramble yours."
          />
        </div>
        <p className="mt-3 text-13 text-ink-faint leading-relaxed">
          The scrambling uses a kind of math called <Term>fully homomorphic encryption (FHE)</Term> — the chain can
          add and subtract the hidden numbers without ever seeing them. You don&apos;t need to understand the math to
          use the app; just know that the amounts are locked, and you hold the key.
        </p>
      </Section>

      {/* Wrapper + registry */}
      <Section title="“Wrapper” and “registry,” explained">
        <div className="space-y-3">
          <MiniCard
            tone="plain"
            icon="wrap"
            title="A wrapper is a confidential twin of a token"
            body="Take a token you already know, like USDC. Its confidential twin is cUSDC — same value, 1-to-1, but with the amount hidden. “Wrapping” means swapping the public version for the confidential one; “unwrapping” swaps it back. Nothing is lost in either direction."
          />
          <MiniCard
            tone="plain"
            icon="list"
            title="A registry is the official directory"
            body="Anyone could make a fake “confidential USDC.” The registry is the trusted list of which public tokens have a genuine, approved confidential twin — so you always wrap into the real one. This app simply shows you that list and lets you use it."
          />
        </div>
      </Section>

      {/* The four actions */}
      <Section title="The four things you can do here">
        <div className="grid sm:grid-cols-2 gap-3">
          <StepCard n={1} title="Wrap" body="Turn a public token into its confidential twin. You approve the amount, deposit it, and receive an equal confidential balance that only you can read." />
          <StepCard n={2} title="Reveal" body="Check your real amount. You approve it once with your wallet (a free signature, no fee), and the number is shown to you alone." />
          <StepCard n={3} title="Send confidentially" body="Move a confidential balance to someone else. Observers see that a transfer happened, but not how much — the amount stays hidden." />
          <StepCard n={4} title="Unwrap" body="Turn the confidential token back into the public one whenever you like. Only the exact amount you withdraw is revealed, to release your funds." />
        </div>
      </Section>

      {/* Lifecycle rail */}
      <Section title="The journey of a balance">
        <LifecycleRail />
        <p className="mt-3 text-13 text-ink-faint leading-relaxed">
          A public token becomes confidential when you wrap it, stays hidden while you hold or send it, can be revealed to
          you any time, and becomes public again when you unwrap. You&apos;re always in control of which step it&apos;s in.
        </p>
      </Section>

      {/* Safety */}
      <Section title="Is my money safe?">
        <div className="grid sm:grid-cols-3 gap-3">
          <MiniCard tone="plain" icon="lock" title="You hold the key" body="Balances are revealed only when you approve it with your own wallet. No one can read your amount for you." />
          <MiniCard tone="plain" icon="shield" title="No single point of trust" body="Unlocking is split across many independent parties (a threshold network). No one party can decrypt on its own." />
          <MiniCard tone="plain" icon="wrap" title="1-to-1, always" body="Every confidential token is fully backed by the public token locked inside it. Unwrap returns exactly what you put in." />
        </div>
      </Section>

      {/* Glossary */}
      <Section title="Words you'll see, in plain English">
        <Card className="divide-y divide-line overflow-hidden">
          {GLOSSARY.map((g) => (
            <div key={g.term} className="grid sm:grid-cols-[200px_1fr] gap-1 sm:gap-4 px-4 py-3">
              <div className="text-13 font-medium text-ink">{g.term}</div>
              <div className="text-13 text-ink-faint leading-relaxed">{g.plain}</div>
            </div>
          ))}
        </Card>
      </Section>

      {/* Footer CTA */}
      <Card className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6">
        <div className="flex items-center gap-4">
          <Mascot mood="celebrate" size={64} />
          <div>
            <h3 className="text-sm font-semibold text-ink">Ready to try it?</h3>
            <p className="mt-1 text-13 text-ink-faint">Grab free test tokens, then wrap your first one.</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <Link href="/faucet" className="h-9 px-4 inline-flex items-center rounded-pill text-13 font-medium text-ink-muted border border-line hover:border-line-strong hover:text-ink transition-colors">
            Get test tokens
          </Link>
          <Link href="/" className="h-9 px-4 inline-flex items-center rounded-pill text-13 font-semibold bg-ink text-base hover:brightness-105 active:scale-[0.97] transition">
            Open the registry
          </Link>
        </div>
      </Card>
    </div>
  );
}

const GLOSSARY: { term: string; plain: string }[] = [
  { term: "Confidential token (ERC-7984)", plain: "A token whose amount is hidden. The confidential twin of a normal token." },
  { term: "Wrap / Unwrap", plain: "Swap a public token for its confidential twin, and back again. Always 1-to-1." },
  { term: "Reveal (decrypt)", plain: "Show yourself the real amount of a hidden balance — only you can." },
  { term: "Encryption (FHE)", plain: "The math that hides the amounts while still letting the chain do the bookkeeping." },
  { term: "Handle", plain: "The scrambled stand-in for your amount that lives on-chain. Useless to anyone but you." },
  { term: "Signature", plain: "A free, gas-less approval from your wallet that proves a balance is yours to reveal." },
  { term: "Relayer", plain: "The helper service that unlocks a value for you after you approve it — it never sees your key alone." },
  { term: "Faucet", plain: "A tap that hands out free practice tokens on the test network." },
  { term: "Registry", plain: "The official directory of which public tokens have an approved confidential twin." },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-ink tracking-tight mb-3">{title}</h2>
      {children}
    </section>
  );
}

function Term({ children }: { children: React.ReactNode }) {
  return <span className="text-ink font-medium">{children}</span>;
}

function MiniCard({
  tone,
  icon,
  title,
  body,
}: {
  tone: "plain" | "accent";
  icon: IconKind;
  title: string;
  body: string;
}) {
  return (
    <div
      className={cn(
        "rounded-card border p-4",
        tone === "accent" ? "border-line-strong bg-elevate/[0.06]" : "border-line glass-soft",
      )}
    >
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            "grid place-items-center h-8 w-8 rounded-input border shrink-0",
            tone === "accent" ? "border-line-strong bg-ink/10 text-ink" : "border-line bg-raised text-ink-muted",
          )}
        >
          <Icon kind={icon} />
        </span>
        <h3 className="text-13 font-medium text-ink">{title}</h3>
      </div>
      <p className="mt-2.5 text-13 text-ink-faint leading-relaxed">{body}</p>
    </div>
  );
}

function StepCard({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <div className="rounded-card border border-line glass-soft p-4">
      <div className="flex items-center gap-2.5">
        <span className="grid place-items-center h-7 w-7 rounded-pill bg-ink/15 text-ink text-13 font-semibold">
          {n}
        </span>
        <h3 className="text-13 font-medium text-ink">{title}</h3>
      </div>
      <p className="mt-2.5 text-13 text-ink-faint leading-relaxed">{body}</p>
    </div>
  );
}

function LifecycleRail() {
  const nodes = ["Public token", "Wrap", "Confidential balance", "Reveal", "Cleartext"];
  return (
    <div className="rounded-card border border-line glass-soft p-4 overflow-x-auto">
      <div className="flex items-center gap-2 min-w-[520px]">
        {nodes.map((label, i) => (
          <div key={label} className="flex items-center gap-2 flex-1">
            <div
              className={cn(
                "flex-1 text-center rounded-input border px-2 py-2 text-2xs font-medium",
                i === 2
                  ? "border-line-strong bg-elevate/[0.06] text-ink"
                  : i === 4
                    ? "border-line-strong bg-elevate/[0.06] text-ink"
                    : "border-line bg-elevate/[0.025] text-ink-muted",
              )}
            >
              {label}
            </div>
            {i < nodes.length - 1 && (
              <div className="wire-track h-px w-6 shrink-0">
                <span className="wire-pulse" data-active="false" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

type IconKind = "eye" | "lock" | "wrap" | "list" | "shield";

function Icon({ kind }: { kind: IconKind }) {
  const c = "h-4 w-4";
  switch (kind) {
    case "eye":
      return (
        <svg viewBox="0 0 18 18" className={c} fill="none" aria-hidden="true">
          <path d="M1.5 9S4 4 9 4s7.5 5 7.5 5-2.5 5-7.5 5-7.5-5-7.5-5Z" stroke="currentColor" strokeWidth="1.3" />
          <circle cx="9" cy="9" r="2.2" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      );
    case "lock":
      return (
        <svg viewBox="0 0 18 18" className={c} fill="none" aria-hidden="true">
          <rect x="4" y="8" width="10" height="7" rx="1.8" stroke="currentColor" strokeWidth="1.3" />
          <path d="M6.2 8V6.4a2.8 2.8 0 0 1 5.6 0V8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
    case "wrap":
      return (
        <svg viewBox="0 0 18 18" className={c} fill="none" aria-hidden="true">
          <path d="M4 7a5 5 0 0 1 9-1M14 11a5 5 0 0 1-9 1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          <path d="M13 3v3h-3M5 15v-3h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "list":
      return (
        <svg viewBox="0 0 18 18" className={c} fill="none" aria-hidden="true">
          <path d="M6 5h8M6 9h8M6 13h8M3.5 5h.01M3.5 9h.01M3.5 13h.01" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
    case "shield":
      return (
        <svg viewBox="0 0 18 18" className={c} fill="none" aria-hidden="true">
          <path d="M9 2.5 14.5 4.5v4C14.5 12 12 14.5 9 15.5 6 14.5 3.5 12 3.5 8.5v-4L9 2.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
          <path d="m6.8 9 1.6 1.6L11.4 7.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
  }
}
