import { sepolia } from "wagmi/chains";

/**
 * Proof-of-lifecycle receipts — real Sepolia transaction hashes produced by
 * running every flow in THIS app against the official registry.
 *
 * Fill each `txHash` after executing the step (Registry row → action, or
 * Portfolio → reveal). `null` = the step has no transaction by design
 * (EIP-712 user-decrypt is an off-chain signature + relayer round-trip).
 * An empty string renders honestly as "receipt pending" — never fake a hash.
 */
export const PROOF_CHAIN_ID = sepolia.id;

export interface ProofStep {
  key: string;
  title: string;
  /** The exact contract call the step makes. */
  call: string;
  /** Sepolia tx hash, "" while pending, or null for off-chain steps. */
  txHash: string | null;
  note?: string;
}

export const PROOF_STEPS: ProofStep[] = [
  {
    key: "faucet",
    title: "Faucet — mint test ERC-20",
    call: "ERC20.mint(account, amount)",
    txHash: "",
  },
  {
    key: "approve",
    title: "Approve the wrapper",
    call: "ERC20.approve(wrapper, amount)",
    txHash: "",
  },
  {
    key: "wrap",
    title: "Wrap into the confidential twin",
    call: "wrapper.wrap(account, amount)",
    txHash: "",
  },
  {
    key: "reveal",
    title: "Private reveal (EIP-712 user-decrypt)",
    call: "confidentialBalanceOf → relayer userDecrypt",
    txHash: null,
    note: "Off-chain by design — one wallet signature, cleartext returned only to the holder. Shown in the demo video.",
  },
  {
    key: "unwrap",
    title: "Unwrap — burn encrypted amount",
    call: "wrapper.unwrap(from, to, encAmount, proof)",
    txHash: "",
  },
  {
    key: "finalize",
    title: "Finalize unwrap — release ERC-20",
    call: "wrapper.finalizeUnwrap(requestId, amount, proof)",
    txHash: "",
  },
];
