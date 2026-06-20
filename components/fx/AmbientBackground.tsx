"use client";

/**
 * Ambient layer: layered Zama-yellow/amber aurora glows on the base, breathing
 * slowly, for depth and warmth — the "premium" backdrop. Fixed, non-interactive,
 * behind everything. Reduced-motion freezes the breathe; light mode dims the
 * whole layer so it reads as a faint warm tint rather than a wash.
 */
export function AmbientBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden [.light_&]:opacity-50"
      aria-hidden="true"
    >
      {/* Soft top vignette — seats the whole page in a faint warm glow. */}
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(120% 80% at 50% -8%, rgba(255,210,8,0.05), transparent 55%)" }}
      />
      {/* Primary bloom, top-center — large and soft. */}
      <div
        className="absolute left-1/2 -top-52 h-[680px] w-[1200px] -translate-x-1/2 rounded-pill blur-3xl animate-breathe"
        style={{
          background:
            "radial-gradient(50% 50% at 50% 50%, rgba(255,210,8,0.17), rgba(255,210,8,0.05) 50%, transparent 72%)",
        }}
      />
      {/* Warm amber glow, lower-right — a second tone for richness. */}
      <div
        className="absolute right-[-14%] bottom-[-16%] h-[620px] w-[760px] rounded-pill blur-3xl animate-breathe"
        style={{
          animationDelay: "-3s",
          background: "radial-gradient(50% 50% at 50% 50%, rgba(255,168,8,0.11), transparent 70%)",
        }}
      />
      {/* Counter-glow, upper-left — balances the composition. */}
      <div
        className="absolute left-[-12%] top-[-10%] h-[520px] w-[620px] rounded-pill blur-3xl animate-breathe"
        style={{
          animationDelay: "-6s",
          background: "radial-gradient(50% 50% at 50% 50%, rgba(255,210,8,0.07), transparent 70%)",
        }}
      />
      {/* Fine top hairline of light to seat the header. */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-line-strong to-transparent" />
    </div>
  );
}
