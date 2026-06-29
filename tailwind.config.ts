import type { Config } from "tailwindcss";

/**
 * Design tokens are the law here (see DESIGN.md). Anything not expressed as a
 * token below should not appear in a className. One accent only: Zama yellow.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    // Tailwind's default spacing scale is already a 4px grid (0.25rem steps,
    // with 0.5/1.5/2.5/3.5 half-steps). We keep it rather than re-declaring a
    // partial scale — a missing key (e.g. 3.5) silently drops icon sizing.
    extend: {
      screens: {
        // Extra-small breakpoint so the header can reveal the title once there's room.
        xs: "400px",
      },
      colors: {
        // All tokens resolve to CSS variables so the theme can switch (dark
        // default; `.light` on <html> overrides them — see globals.css).
        // Background layers.
        base: "rgb(var(--base) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        raised: "rgb(var(--raised) / <alpha-value>)",
        // Elevation overlay (white on dark, black on light) for hover/active washes.
        elevate: "rgb(var(--overlay) / <alpha-value>)",
        // The one accent (bright yellow on dark, deeper amber on light for contrast).
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          soft: "rgb(var(--accent) / 0.12)",
          faint: "rgb(var(--accent) / 0.06)",
        },
        // Accent for TEXT/links/icons — readable per theme (gold on light).
        accentInk: "rgb(var(--accent-ink) / <alpha-value>)",
        // Status — muted, semantic only.
        ok: "rgb(var(--ok) / <alpha-value>)",
        danger: "rgb(var(--danger) / <alpha-value>)",
        warn: "rgb(var(--warn) / <alpha-value>)",
        // Grayscale text ramp.
        ink: {
          DEFAULT: "rgb(var(--ink) / <alpha-value>)",
          muted: "rgb(var(--ink-muted) / <alpha-value>)",
          faint: "rgb(var(--ink-faint) / <alpha-value>)",
          ghost: "rgb(var(--ink-ghost) / <alpha-value>)",
        },
        // 1px hairline borders.
        line: {
          DEFAULT: "rgb(var(--line) / 0.08)",
          strong: "rgb(var(--line) / 0.12)",
        },
      },
      fontFamily: {
        // Inter for UI, JetBrains Mono for all addresses/hashes/amounts/numbers.
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        // Developer density: 13–14px body in tables.
        "2xs": ["11px", { lineHeight: "16px", letterSpacing: "0.01em" }],
        xs: ["12px", { lineHeight: "16px" }],
        "13": ["13px", { lineHeight: "18px" }],
        sm: ["14px", { lineHeight: "20px" }],
        base: ["15px", { lineHeight: "22px" }],
        lg: ["17px", { lineHeight: "24px" }],
        xl: ["20px", { lineHeight: "28px" }],
        "2xl": ["24px", { lineHeight: "30px", letterSpacing: "-0.01em" }],
        "3xl": ["30px", { lineHeight: "36px", letterSpacing: "-0.02em" }],
      },
      borderRadius: {
        // BlindPay-style generous rounding.
        card: "16px",
        input: "12px",
        pill: "9999px",
      },
      fontFeatureSettings: {
        tnum: '"tnum", "cv01"',
      },
      transitionTimingFunction: {
        // Financial tool: ease-out only, no springs.
        out: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      transitionDuration: {
        "150": "150ms",
        "200": "200ms",
        "250": "250ms",
      },
      keyframes: {
        // Faint shimmer for redacted ciphertext + skeletons.
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        // The unlock moment: blur-to-sharp resolve.
        resolve: {
          "0%": { filter: "blur(6px)", opacity: "0.4" },
          "100%": { filter: "blur(0)", opacity: "1" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(2px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        // The decrypt reveal: blur→sharp, one soft accent glow, then still.
        "decrypt-reveal": {
          "0%": { filter: "blur(6px)", opacity: "0.4" },
          "55%": { filter: "blur(0)", opacity: "1", textShadow: "0 0 14px rgba(255,210,8,0.45)", color: "#FFE25A" },
          "100%": { filter: "blur(0)", opacity: "1", textShadow: "0 0 0 rgba(255,210,8,0)" },
        },
        // One-shot accent glow when a value finishes decrypting.
        unlock: {
          "0%": { textShadow: "0 0 0 rgba(255,210,8,0)", color: "#FFD208" },
          "30%": { textShadow: "0 0 18px rgba(255,210,8,0.45)", color: "#FFE25A" },
          "100%": { textShadow: "0 0 0 rgba(255,210,8,0)", color: "#EDEDEF" },
        },
        // Staggered row/content entrance — fade + tiny rise.
        "rise-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        // Slow breathing for the ambient aurora.
        breathe: {
          "0%, 100%": { opacity: "0.5", transform: "scale(1)" },
          "50%": { opacity: "0.85", transform: "scale(1.06)" },
        },
        // Error nudge — shakes ONLY the offending field, never the page.
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "20%": { transform: "translateX(-4px)" },
          "40%": { transform: "translateX(4px)" },
          "60%": { transform: "translateX(-3px)" },
          "80%": { transform: "translateX(3px)" },
        },
        // The single permitted bounce — faucet success "drop into balance".
        drop: {
          "0%": { transform: "translateY(-9px)", opacity: "0" },
          "60%": { transform: "translateY(2px)", opacity: "1" },
          "100%": { transform: "translateY(0)" },
        },
        // Toast self-dismiss timer bar.
        "timer-bar": {
          from: { transform: "scaleX(1)" },
          to: { transform: "scaleX(0)" },
        },
        // Gentle toast entrance from the right.
        "toast-in": {
          "0%": { opacity: "0", transform: "translateX(12px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        // Border-trace sweep for the primary CTA on hover.
        "trace": {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "200% 50%" },
        },
      },
      animation: {
        shimmer: "shimmer 2.4s ease-out infinite",
        resolve: "resolve 200ms cubic-bezier(0.16,1,0.3,1) forwards",
        "fade-in": "fade-in 200ms cubic-bezier(0.16,1,0.3,1) forwards",
        unlock: "unlock 1100ms cubic-bezier(0.16,1,0.3,1) forwards",
        "decrypt-reveal": "decrypt-reveal 700ms cubic-bezier(0.16,1,0.3,1) forwards",
        "rise-in": "rise-in 360ms cubic-bezier(0.16,1,0.3,1) both",
        breathe: "breathe 9s ease-in-out infinite",
        shake: "shake 360ms ease-out",
        // A whisper of overshoot — the only place we allow it.
        drop: "drop 460ms cubic-bezier(0.22, 1.15, 0.4, 1) both",
        "toast-in": "toast-in 220ms cubic-bezier(0.16,1,0.3,1) both",
      },
    },
  },
  plugins: [],
};

export default config;
