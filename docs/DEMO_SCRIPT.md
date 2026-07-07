# Demo video script (~3 minutes)

**Setup:** Sepolia wallet with a little ETH, clean browser profile, dark theme, 1440×900.

| Time | Scene | Say |
|---|---|---|
| 0:00–0:15 | Registry page, cursor idle | "This is the Confidential Wrapper Registry — every ERC-20 with an approved confidential twin, read live from Zama's on-chain registry. Nothing here is a hardcoded list." |
| 0:15–0:35 | Hover rows, use search + filters, flip network to Mainnet and back | "Search, status filters, keyboard navigation. Mainnet works read-only; the full lifecycle runs on Sepolia." |
| 0:35–0:55 | Row → Faucet, claim | "Test tokens come from the official mock contracts — one claim, straight to the wallet." |
| 0:55–1:20 | Wrap tab: approve, wrap | "Approve, then wrap. From this moment the amount I hold is encrypted on-chain — an euint64 handle, not a number." |
| 1:20–1:50 | Portfolio: masked rows → Approve & reveal all → cascade | "My portfolio shows balances as ciphertext. One EIP-712 signature opens a decrypt session — every balance reveals client-side, visible only to me. Note the eye: I can re-mask instantly." |
| 1:50–2:20 | Token page → Unwrap: submit, finalize | "Unwrap is two-phase: burn an encrypted amount, then finalize once the relayer's public decrypt lands — the public ERC-20 comes back." |
| 2:20–2:40 | Activity page | "The live feed proves the point: wraps and confidential sends show *that* something moved — never how much. Only unwraps reveal a public amount." |
| 2:40–3:00 | Developers page: proof table, snippets, Add-a-pair | "Everything you just watched is receipted — real Sepolia transactions, linked. And the Developer Kit ships verified copy-paste snippets plus an on-chain pair builder, so anyone can build on the registry too." |

**Closing frame:** Registry page + "Every balance encrypted. Until you reveal."
