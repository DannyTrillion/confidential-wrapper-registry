"use client";

import { NETWORKS } from "@/lib/networks";
import { truncateAddress } from "@/lib/format";
import { BrandGlyph } from "./BrandGlyph";
import { TOUR_START_EVENT } from "@/components/onboarding/OnboardingTour";

// Set NEXT_PUBLIC_GITHUB_URL in .env.local to your public repo. The link only
// renders when configured, so an unset value never ships a placeholder.
const GITHUB = process.env.NEXT_PUBLIC_GITHUB_URL;
const DOCS = "https://docs.zama.org/protocol/protocol-apps/confidential-tokens/wrapper-registry";

/** Footer with trust signals: the canonical registry addresses + source links. */
export function Footer() {
  return (
    <footer className="border-t border-line mt-8">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="max-w-sm">
            <div className="flex items-center gap-2">
              <span className="grid place-items-center h-6 w-6 rounded-[6px] bg-accent shrink-0">
                <BrandGlyph className="h-3.5 w-3.5 text-[#0a0a0a]" />
              </span>
              <span className="text-13 font-semibold text-ink">Confidential Wrapper Registry</span>
            </div>
            <p className="mt-2 text-2xs text-ink-faint leading-relaxed">
              A usable product on Zama&apos;s onchain Wrappers Registry. Encrypted balances stay
              encrypted — revealed client-side, only with your signature.
            </p>
            <div className="mt-3 flex items-center gap-3 text-2xs">
              {GITHUB && <FooterLink href={GITHUB}>GitHub ↗</FooterLink>}
              <FooterLink href={DOCS}>Docs ↗</FooterLink>
              <button
                onClick={() => window.dispatchEvent(new Event(TOUR_START_EVENT))}
                className="text-ink-faint hover:text-ink transition-colors"
              >
                Take a tour
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-10 gap-y-3">
            {Object.values(NETWORKS).map((net) => (
              <div key={net.chainId}>
                <div className="text-2xs uppercase tracking-wide text-ink-ghost">{net.name} registry</div>
                <a
                  href={`${net.explorerUrl}/address/${net.registry}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block font-mono text-2xs text-ink-muted hover:text-ink transition-colors"
                  title={net.registry}
                >
                  {truncateAddress(net.registry, 8, 6)} ↗
                </a>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-line flex flex-wrap items-center justify-between gap-2 text-2xs text-ink-ghost">
          <span>Built on Zama FHEVM · ERC-7984 confidential tokens</span>
          <span className="font-mono">Sepolia · Ethereum mainnet</span>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-ink-faint hover:text-ink transition-colors">
      {children}
    </a>
  );
}
