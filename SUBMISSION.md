# Submission

Quick index of the deliverables and where each requirement is met. Fill in the
links before submitting.

## Links

- **Live app:** <!-- paste your deployed URL -->
- **Demo video (≤3 min):** <!-- paste link -->
- **X thread / article:** <!-- paste link -->
- **Repository:** <!-- paste GitHub URL -->

## At a glance

- **Networks:** Sepolia (`11155111`) and Ethereum mainnet (`1`). Faucet is Sepolia-only; wrap / unwrap / reveal work on both.
- **Registry source:** read live from the onchain Wrappers Registry on each network (no hardcoded token list), with an optional local config for custom pairs. See [README](./README.md#hybrid-registry--onchain-truth--local-overrides).
- **Add a pair:** register onchain, or add one entry to [`lib/registry/customPairs.ts`](./lib/registry/customPairs.ts). To mint a fresh pair to test with: `cd contracts && npm run deploy:custom`. See [README](./README.md#how-to-add-a-new-erc-20--erc-7984-pair).

## Requirements checklist

- [ ] Live URL where judges can connect a wallet and use every feature
- [ ] Both networks supported (Sepolia + mainnet)
- [ ] Registry sourced onchain (hybrid with local config)
- [ ] All official Sepolia cTokenMocks + mainnet wrapper pairs surfaced
- [ ] Wrap and unwrap for every registry pair
- [ ] Reveal (user-decryption) for any ERC-7984 token, registry or not
- [ ] Sepolia faucet for the official cTokenMocks
- [ ] Documented process for adding a new pair (with example)
- [ ] Public, open-source repository
- [ ] Demo video recorded
- [ ] X thread published

## Demo flow (for the video)

Browse the registry → claim from the Sepolia faucet → wrap a cTokenMock → reveal
the resulting confidential balance → unwrap back → reveal an arbitrary ERC-7984
token outside the registry → show how a new pair is added.
