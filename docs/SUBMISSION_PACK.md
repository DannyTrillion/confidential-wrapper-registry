# Confidential Wrapper Registry — Submission Pack

> **Zama Developer Program — Mainnet Season 3**
> The complete, polished, verifiable product on Zama's official Confidential Token Wrappers Registry.

## One-line pitch

Every wrapper onchain, every balance encrypted — a jup.ag-grade registry explorer, portfolio,
and developer kit for ERC-20 ↔ ERC-7984 confidential tokens, with every flow receipted on Sepolia.

## Live

- **App:** https://confidential-wrapper-registry-eta.vercel.app
- **Repo:** https://github.com/DannyTrillion/confidential-wrapper-registry
- **Demo video:** <!-- fill: video URL -->

## What it does

| Area | Coverage |
|---|---|
| Registry explorer | Reads the official registry live on **Sepolia + Ethereum mainnet** (no hardcoded lists); search, Active/Revoked filters, keyboard navigation, per-row **Wrap · Unwrap · Reveal** actions |
| Portfolio | jup.ag/portfolio-style dashboard: encrypted net worth, **one-signature reveal-all** (EIP-712 session), per-position reveal, hide-values toggle, reveal-any-address |
| Lifecycle | Faucet → Approve → Wrap → Private Reveal → two-phase Unwrap/Finalize — all in-app, receipts in `lib/proof.ts` and on `/developers` |
| Activity | Live on-chain feed of wraps, confidential sends, unwraps, registry changes — amounts stay hidden where they're encrypted |
| Developer Kit | `/developers`: verified registry addresses, copy-paste snippets compiled against this repo's versions, syntax-highlighted, plus the **Add-a-pair** builder with on-chain ERC-7984 verification |
| Extensibility | Hybrid registry: official on-chain pairs merge with local config pairs (tagged "Local"); on-chain truth wins |
| Onboarding | First-run guided tour (Cipher mascot), plain-English `/docs` guide, ⌘K command palette |
| Design | Near-black slate system, yellow identity accent used with discipline, full light theme, reduced-motion respected, skeletons on every load path |

## Verified lifecycle — receipts

Executed on Sepolia against the official registry `0x2f0750Bbb0A246059d80e94c454586a7F27a128e`.
Fill each hash after running the flow in-app (they also render on `/developers`; edit `lib/proof.ts`).

| # | Step | Contract call | Tx hash |
|---|---|---|---|
| 1 | Faucet mint | `ERC20.mint(account, amount)` | <!-- 0x… --> |
| 2 | Approve | `ERC20.approve(wrapper, amount)` | <!-- 0x… --> |
| 3 | Wrap | `wrapper.wrap(account, amount)` | <!-- 0x… --> |
| 4 | Private Reveal | EIP-712 user-decrypt via relayer | *off-chain by design — see demo video* |
| 5 | Unwrap | `wrapper.unwrap(from, to, encAmount, proof)` | <!-- 0x… --> |
| 6 | Finalize | `wrapper.finalizeUnwrap(requestId, amount, proof)` | <!-- 0x… --> |

## Verified addresses (canonical, from docs.zama.org)

| Network | Wrappers Registry |
|---|---|
| Ethereum mainnet | `0xeb5015fF021DB115aCe010f23F55C2591059bBA0` |
| Sepolia | `0x2f0750Bbb0A246059d80e94c454586a7F27a128e` |

## Honest limitations

- Write flows (faucet, wrap, unwrap) are Sepolia-only; mainnet is read-only unless a Zama relayer API key is configured (`NEXT_PUBLIC_ZAMA_RELAYER_API_KEY`), which unlocks mainnet reveal.
- Reveal requires an EOA (EIP-712 signature format); smart-contract wallets untested.
- The decrypt session is cached client-side for its window; clearing storage re-prompts one signature.

## Tech stack

Next.js 14 (App Router) · TypeScript · wagmi v2 + viem · @tanstack/react-query ·
@zama-fhe/relayer-sdk 0.4.x · Tailwind CSS · no component library — all UI custom.
