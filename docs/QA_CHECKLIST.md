# Pre-submission QA checklist

Run top to bottom on a clean profile (or `?notour` off) against Sepolia. Record tx hashes
in `lib/proof.ts` and `docs/SUBMISSION_PACK.md` as you go.

## Lifecycle (produces the receipts)

- [ ] Connect wallet (MetaMask, Sepolia) — yellow Connect in top bar
- [ ] Faucet: claim a test token → tx hash: `________________`
- [ ] Token page → Wrap tab: approve → tx hash: `________________`
- [ ] Wrap 100 tokens → tx hash: `________________`
- [ ] Portfolio: "Approve & reveal all" → one EIP-712 signature, balance resolves with yellow glow
- [ ] Hide-values eye re-masks revealed balances
- [ ] Token page → Unwrap tab: submit encrypted amount → tx hash: `________________`
- [ ] Finalize unwrap after relayer decrypt → tx hash: `________________`
- [ ] Underlying ERC-20 balance increased (visible on token page)

## Registry

- [ ] Sepolia shows all pairs incl. the "Local" DEMOUSD tag; mainnet switcher shows mainnet pairs read-only
- [ ] Search by symbol, name, and address each filter correctly
- [ ] Active/Revoked filters + counts correct; keyboard ↑/↓/Enter navigation works
- [ ] Row actions: Wrap / Unwrap / Reveal deep-link to the right token tab
- [ ] Disconnected: Balance column shows em-dashes; connected: `•••` for held handles, never a number

## Pages

- [ ] Portfolio disconnected: encrypted preview + Connect; connected: dashboard fully populated
- [ ] Activity feed loads; hidden amounts stay hidden; filters work
- [ ] Faucet grid: cooldown ring after claim
- [ ] Guide `/docs` renders; tour replays from sidebar "Take a tour"
- [ ] Developers: proof table shows VERIFIED chips (after hashes filled); snippets copy; Add-a-pair verifies a real pair on-chain
- [ ] `/extend` and `/balances` redirect correctly

## Chrome

- [ ] ⌘K palette: token jump, page jump, network switch
- [ ] Light theme: readable everywhere, no dark-only artifacts
- [ ] Mobile 390px: tab bar, cards, no horizontal scroll
- [ ] Faucet lists only mintable mocks; restricted (tGBP, steakcUSDC) shown in the note, not as cards
- [ ] Re-capture README screenshots in `docs/` (explorer, token page, palette) on the current design
- [ ] `npm run build` clean; `npx tsc --noEmit` clean
