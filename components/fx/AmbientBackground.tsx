"use client";

/**
 * Ambient layer: soft Zama-yellow aurora glows on pure black, breathing slowly.
 * Fixed, non-interactive, behind everything. Reduced-motion just freezes them
 * (the breathe animation is disabled globally under prefers-reduced-motion).
 */
export function AmbientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {/* Primary yellow bloom, top-center. */}
      <div
        className="absolute left-1/2 -top-44 h-[600px] w-[1000px] -translate-x-1/2 rounded-pill blur-3xl animate-breathe"
        style={{
          background:
            "radial-gradient(50% 50% at 50% 50%, rgba(255,210,8,0.14), rgba(255,210,8,0.04) 55%, transparent 75%)",
        }}
      />
      {/* Warm lower-right glow so the page keeps a faint yellow depth throughout. */}
      <div
        className="absolute right-[-12%] bottom-[-12%] h-[560px] w-[680px] rounded-pill blur-3xl animate-breathe"
        style={{
          animationDelay: "-3s",
          background: "radial-gradient(50% 50% at 50% 50%, rgba(255,210,8,0.07), transparent 72%)",
        }}
      />
      {/* Fine top hairline of light to seat the header. */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-line-strong to-transparent" />
    </div>
  );
}
