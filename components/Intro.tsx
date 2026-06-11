import { HeroPanel } from "./fx/HeroPanel";

export function Intro() {
  return (
    <section className="mb-7 sm:mb-9 flex flex-col lg:flex-row lg:items-center justify-between gap-7 lg:gap-8">
      <div className="min-w-0 max-w-2xl">
        {/* Ecosystem trust signal */}
        <span className="inline-flex items-center gap-1.5 rounded-pill border border-accent/25 bg-accent-faint px-2.5 py-1 text-2xs font-medium text-accent">
          <span className="h-1.5 w-1.5 rounded-pill bg-accent" />
          Powered by Zama Protocol
        </span>

        {/* Two-tone display headline — second line outlined (BlindPay signature). */}
        <h1 className="mt-4 text-4xl sm:text-5xl font-bold tracking-tight leading-[1.05]">
          <span className="text-ink">Confidential</span>
          <br />
          <span className="text-outline">Wrapper Registry.</span>
        </h1>

        {/* Keyword tagline */}
        <p className="mt-4 text-lg text-ink-muted leading-snug">
          Every wrapper, <span className="text-ink font-medium">onchain</span>. Every balance{" "}
          <span className="text-accent font-medium">encrypted</span> — until you decrypt.
        </p>

        <p className="mt-3 text-sm text-ink-faint max-w-xl leading-relaxed">
          Every public token with an approved confidential twin, straight from Zama&apos;s official onchain
          registry, on both test and main networks. Make a token confidential, turn it back, grab test
          tokens, and reveal any hidden balance with a single approval.{" "}
          <a href="/docs" className="text-accent hover:underline">New here? Read the guide →</a>
        </p>
      </div>

      {/* Live segment: your real (hidden) balances + a smart action — or the
          looping unlock animation when no wallet is connected. Full-width on
          mobile (stacked under the copy), fixed beside it on desktop. */}
      <HeroPanel className="w-full max-w-[360px] mx-auto lg:mx-0 lg:w-[340px] lg:max-w-none shrink-0" />
    </section>
  );
}
