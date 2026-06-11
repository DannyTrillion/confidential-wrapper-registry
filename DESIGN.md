# DESIGN.md — Confidential Wrapper Registry

You are a senior product designer and frontend engineer who has shipped interfaces
at the level of Linear, Vercel, Stripe, and Rainbow Wallet. Every UI decision in this
project must meet that bar. Follow these rules without exception.

## DESIGN SYSTEM

- Dark theme is the default and primary theme. Background layers:
  `#0A0A0B` (base), `#131316` (surface), `#1C1C21` (raised). Never pure black/white.
- One accent color only: **Zama yellow `#FFD208`**. Use it sparingly — primary CTAs,
  active states, the decrypt/unlock moment. Everything else is grayscale.
- Status colors: green only for confirmed/valid, red only for revoked/failed,
  amber for pending. Muted, desaturated versions (e.g. `#4ADE80` at ~80%).
- Typography: **Inter** for UI text, **JetBrains Mono** for ALL addresses, hashes,
  amounts, and numeric data. Tabular figures everywhere numbers align.
- Spacing on a strict 4px grid. Border radius 8px cards, 6px inputs, full for pills.
  Borders 1px at 8–10% white opacity — never heavy.
- No drop shadows for depth on dark; use background-layer steps and 1px borders.

## INTERACTION QUALITY

- Every async action (wrap, unwrap, decrypt, faucet) has four explicit visual states:
  idle, pending (plain-words progress, e.g. "Waiting for signature…" → "Encrypting
  input…" → "Confirming on Sepolia…"), success, and error with a human-readable
  message plus the raw error in a collapsible.
- Encrypted balances render as redacted ciphertext (`••••••` with a faint shimmer).
  Decryption is THE signature interaction: on success the value resolves into focus
  with a 200ms blur-to-sharp transition. Most polished animation in the app.
- All transitions 150–250ms ease-out. No bouncy/springy — this is a financial tool.
  Skeleton loaders, never layout shift.
- Empty/zero/error states are designed, not afterthoughts. A balance handle of
  `bytes32(0)` means "no balance yet" — say that, never show an error or `0x000…`.
- Everything keyboard-accessible, visible focus rings (yellow, 2px offset), WCAG AA.

## LAYOUT

- Information density like Etherscan/Linear: compact rows, 13–14px body text in
  tables, generous density over marketing whitespace. Audience is developers.
- Addresses always truncated middle (`0x1234…AB12`) with copy-on-click and an
  Etherscan link. Network badges (Sepolia/Mainnet) visible at all times.
- Fully responsive; tables collapse to cards on mobile.

## MOTION & IDENTITY — "Ciphertext"

The design identity treats encryption as the material, not decoration.

- **Live ciphertext.** Encrypted balances are never static `••••••`; they cycle
  monospaced hex glyphs (`ScrambleText` `cycle` mode) so the value reads as
  *live* encrypted data. Faint by default, accent-tinted while decrypting.
- **Decryption cascade.** On decrypt, the cleartext resolves left-to-right —
  each character locks from scramble into its real digit (`ScrambleText`
  `resolve`), then a single soft accent glow (`animate-unlock`). This is the
  most polished moment in the app. Structural glyphs (`, . space`) never scramble.
- **Ambient field.** A fixed, non-interactive layer: a breathing aurora glow
  (no shadows, depth via light) over a slow field of faint hex glyphs that
  flicker and drift. Both barely-there (≤10% opacity).
- **Micro-interactions.** Animated stat counters; row hover reveals a 2px accent
  edge that scales in; rows enter with a 22ms stagger; addresses run a brief
  re-encrypt scramble on copy; the primary CTA gets one light sheen sweep on
  hover; an active decryption-session chip ("Session · 9d").
- **Command palette (⌘K).** Jump to any token, switch network, run actions.
- **Generative seals.** Token avatars are deterministic 5×5 symmetric glyphs
  derived from the address hash — monochrome for ERC-20, accent for ERC-7984.
- All of the above honour `prefers-reduced-motion` (motion is an enhancement).
  Timings stay 150–250ms ease-out for UI; the cascade is a deliberate ~500ms
  sweep. No springs — this is a financial tool.

## PROCESS

- Before building any screen, write a 5-line spec: purpose, primary action, states,
  data shown, edge cases. Then build it.
- After building, self-review against this file and fix violations before presenting.
  If a screen looks like a generic shadcn/tailwind template, redesign it —
  distinctiveness within these constraints is required.
