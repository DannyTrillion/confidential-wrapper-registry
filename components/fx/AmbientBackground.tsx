"use client";

import { useEffect, useRef } from "react";

/**
 * Ambient layer — jup.ag-style deep-space atmosphere. Three faint nebula glows
 * (mint, cold blue, violet) breathe depth into the near-black ground, and a
 * sparse starfield twinkles at very low alpha. Everything stays whisper-quiet:
 * the glows top out around 6% opacity so content never fights the backdrop.
 * Light theme keeps the calm dot grid instead (stars hidden via globals.css);
 * reduced-motion renders the stars once, statically.
 */
export function AmbientBackground() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let raf = 0;
    let stars: { x: number; y: number; r: number; p: number; s: number }[] = [];

    function seed() {
      canvas!.width = window.innerWidth * dpr;
      canvas!.height = window.innerHeight * dpr;
      const count = Math.floor((window.innerWidth * window.innerHeight) / 17000);
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * canvas!.width,
        y: Math.random() * canvas!.height,
        r: (Math.random() * 0.9 + 0.4) * dpr,
        p: Math.random() * Math.PI * 2,
        s: 0.3 + Math.random() * 0.7,
      }));
    }

    function draw(t: number) {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      ctx!.fillStyle = "#CFE9DF";
      for (const st of stars) {
        ctx!.globalAlpha = reduced
          ? 0.28
          : 0.1 + 0.24 * (0.5 + 0.5 * Math.sin(st.p + t * 0.00045 * st.s));
        ctx!.beginPath();
        ctx!.arc(st.x, st.y, st.r, 0, 7);
        ctx!.fill();
      }
      if (!reduced) raf = requestAnimationFrame(draw);
    }

    seed();
    if (reduced) draw(0);
    else raf = requestAnimationFrame(draw);

    const onResize = () => {
      seed();
      if (reduced) draw(0);
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {/* Nebula glows — mint over the horizon, cold blue and violet drifting in. */}
      <div
        className="alien-glow absolute inset-0"
        style={{
          backgroundImage: [
            // Neutral cosmos — cold blue + violet only. Yellow is identity, not decoration.
            "radial-gradient(640px 440px at 78% -10%, rgba(120, 160, 200, 0.09), transparent 65%)",
            "radial-gradient(900px 620px at 10% -14%, rgba(96, 140, 190, 0.085), transparent 60%)",
            "radial-gradient(720px 540px at -6% 55%, rgba(139, 120, 198, 0.06), transparent 60%)",
            "radial-gradient(1100px 700px at 55% 115%, rgba(110, 140, 175, 0.05), transparent 60%)",
          ].join(", "),
        }}
      />

      {/* Sparse starfield (dark theme only — hidden on light via globals.css). */}
      <canvas ref={ref} className="stars-layer absolute inset-0 h-full w-full" />

      {/* Faint dot grid keeps the surface from reading as a flat void. */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(rgb(var(--overlay) / 0.04) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          maskImage: "radial-gradient(115% 90% at 50% 0%, #000 30%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(115% 90% at 50% 0%, #000 30%, transparent 100%)",
        }}
      />
    </div>
  );
}
