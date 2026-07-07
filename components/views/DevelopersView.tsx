"use client";

import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { CodeBlock } from "@/components/dev/CodeBlock";
import { PageHeader } from "./PageHeader";
import { AddPairSection } from "@/components/dev/AddPairSection";
import { ProofOfLifecycle } from "@/components/dev/ProofOfLifecycle";
import { NETWORKS } from "@/lib/networks";
import { mainnet, sepolia } from "wagmi/chains";

const SEPOLIA = NETWORKS[sepolia.id].registry;
const MAINNET = NETWORKS[mainnet.id].registry;

/* ---- real, copy-paste-accurate snippets (drawn from this app's own hooks) ---- */

const INSTALL = `npm install wagmi@^2.14.6 viem@^2.21.54 @tanstack/react-query@^5.62.7 @zama-fhe/relayer-sdk@^0.4.1`;

const ADDRESSES = `// The registry is the ONLY address you hardcode.
// Every token pair is read from it at runtime — never keep a static list.
export const REGISTRY = {
  ${mainnet.id}:        '${MAINNET}', // Ethereum mainnet
  ${sepolia.id}: '${SEPOLIA}', // Sepolia
} as const`;

const READ_PAIRS = `import { readContract } from 'wagmi/actions'

// Only the registry functions you actually need.
export const REGISTRY_ABI = [
  { type: 'function', name: 'getTokenConfidentialTokenPairsLength',
    stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'getTokenConfidentialTokenPairsSlice',
    stateMutability: 'view',
    inputs: [{ name: 'fromIndex', type: 'uint256' },
             { name: 'toIndex',   type: 'uint256' }],
    outputs: [{ type: 'tuple[]', components: [
      { name: 'tokenAddress',             type: 'address' },
      { name: 'confidentialTokenAddress', type: 'address' },
      { name: 'isValid',                  type: 'bool' },
    ] }] },
] as const

// Page the registry live, then filter to active pairs before enabling actions.
export async function getAllPairs(config, registry) {
  const length = await readContract(config, {
    address: registry, abi: REGISTRY_ABI,
    functionName: 'getTokenConfidentialTokenPairsLength',
  })
  const pairs = await readContract(config, {
    address: registry, abi: REGISTRY_ABI,
    functionName: 'getTokenConfidentialTokenPairsSlice',
    args: [0n, length], // fromIndex incl, toIndex excl — paginate for big sets
  })
  return pairs.filter((p) => p.isValid)
}`;

const RESOLVE_ONE = `// Resolve any ERC-20 to its confidential twin (and whether it's still valid).
const [isValid, confidentialToken] = await readContract(config, {
  address: registry, abi: REGISTRY_ABI,
  functionName: 'getConfidentialTokenAddress',
  args: [tokenAddress],
})`;

const WRAP = `import { parseUnits } from 'viem'
import { writeContract } from 'wagmi/actions'

const amount = parseUnits('100', decimals)

// 1) Approve the wrapper to pull your public ERC-20.
await writeContract(config, {
  address: token, abi: ERC20_ABI, functionName: 'approve',
  args: [wrapper, amount],
})

// 2) Wrap → you receive an equal *confidential* balance (an euint64 handle).
await writeContract(config, {
  address: wrapper, abi: WRAPPER_ABI, functionName: 'wrap',
  args: [account, amount],
})`;

const REVEAL = `import { initSDK, createInstance, SepoliaConfig } from '@zama-fhe/relayer-sdk/web'

await initSDK() // loads the FHE WASM once
const instance = await createInstance({ ...SepoliaConfig, network: window.ethereum })

// 1) Read the opaque balance handle (bytes32).
const handle = await readContract(config, {
  address: wrapper, abi: WRAPPER_ABI,
  functionName: 'confidentialBalanceOf', args: [account],
})
// bytes32(0) means "no balance yet" — never send it to the relayer.
if (handle === '0x' + '0'.repeat(64)) return 0n

// 2) One EIP-712 signature authorizes a time-boxed decrypt session.
const keypair = instance.generateKeypair()
const startTs = Math.floor(Date.now() / 1000)
const durationDays = 10
const eip712 = instance.createEIP712(keypair.publicKey, [wrapper], startTs, durationDays)
const signature = await signer.signTypedData(
  eip712.domain,
  { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
  eip712.message,
)

// 3) The relayer returns the cleartext to *you* only — never on-chain.
const result = await instance.userDecrypt(
  [{ handle, contractAddress: wrapper }],
  keypair.privateKey, keypair.publicKey, signature.replace(/^0x/, ''),
  [wrapper], account, startTs, durationDays,
)
const balance = result[handle] // bigint`;

const UNWRAP = `// Unwrap is two-phase: burn an encrypted amount, then finalize once the
// relayer has decrypted it (this releases the underlying ERC-20).

// Phase 1 — submit an encrypted amount.
const enc = await instance
  .createEncryptedInput(wrapper, account)
  .add64(parseUnits('50', decimals))
  .encrypt()

await writeContract(config, {
  address: wrapper, abi: WRAPPER_ABI, functionName: 'unwrap',
  args: [account, account, enc.handles[0], enc.inputProof],
}) // emits UnwrapRequested(receiver, unwrapRequestId, amount)

// Phase 2 — after the relayer decrypts, finalize with the proof.
const { clearValues, decryptionProof } = await instance.publicDecrypt([amountHandle])
await writeContract(config, {
  address: wrapper, abi: WRAPPER_ABI, functionName: 'finalizeUnwrap',
  args: [unwrapRequestId, clearValues[amountHandle], decryptionProof],
})`;

const FAUCET = `// Zama's mock ERC-20s expose a public mint on Sepolia — for testing only.
await writeContract(config, {
  address: token, abi: ERC20_ABI, functionName: 'mint',
  args: [account, parseUnits('1000', decimals)],
})`;

const ADD_PAIR = `// On-chain pairs appear automatically. To surface a not-yet-registered or
// dev-only pair, add one line to a local config — the app merges it with the
// live registry (on-chain always wins on address conflict).
export const CUSTOM_PAIRS = {
  ${sepolia.id}: [
    { token: '0x…', confidentialToken: '0x…' }, // tagged "Local" in the UI
  ],
}`;

export function DevelopersView() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Build on it"
        title="Developer Kit"
        subtitle="Build on the official Zama Confidential Token Wrappers Registry. Every snippet below is real code from this app's own hooks — copy-paste accurate, verified against live contracts on Sepolia and Ethereum mainnet."
      />

      {/* Credibility chips */}
      <div className="flex flex-wrap gap-2">
        {[
          "Live on Sepolia + Ethereum mainnet",
          "Reads the registry live — no hardcoded lists",
          "EIP-712 user-decryption",
          "Two-phase confidential unwrap",
        ].map((c) => (
          <span
            key={c}
            className="inline-flex items-center gap-1.5 rounded-pill border border-line bg-elevate/[0.03] px-2.5 py-1 text-2xs text-ink-muted"
          >
            <span className="h-1 w-1 rounded-pill bg-ink-faint" aria-hidden="true" />
            {c}
          </span>
        ))}
      </div>

      {/* Proof of lifecycle — receipts, not claims */}
      <section id="proof" className="scroll-mt-20">
        <SectionTitle>Verified lifecycle — receipts, not claims</SectionTitle>
        <SectionDesc>
          Every flow this app ships was executed end-to-end on Sepolia against the official
          registry. Each step below links to its real transaction; the reveal step is
          off-chain by design (an EIP-712 signature, never a transaction).
        </SectionDesc>
        <div className="mt-3">
          <ProofOfLifecycle />
        </div>
      </section>

      {/* Why the official registry */}
      <Card className="p-5">
        <h2 className="text-sm font-semibold text-ink">Why build on the official registry?</h2>
        <p className="mt-1.5 text-13 text-ink-faint leading-relaxed max-w-[75ch]">
          The Wrappers Registry is the canonical on-chain index of production ERC-20 ↔ ERC-7984
          pairs. Integrating it — rather than deploying a throwaway wrapper — gives you:
        </p>
        <ul className="mt-3 grid sm:grid-cols-3 gap-2.5">
          {[
            ["Shared liquidity", "Your users share depth with every other app wrapping the same underlying token."],
            ["Revocation visibility", "The isValid flag lets you disable wrap/unwrap instantly if a wrapper is deprecated — no redeploy."],
            ["Automatic discovery", "When new wrappers are registered, your app surfaces them at runtime with zero code changes."],
          ].map(([t, b]) => (
            <li key={t} className="rounded-input border border-line bg-elevate/[0.02] p-3">
              <div className="text-13 font-medium text-ink">{t}</div>
              <p className="mt-1 text-2xs text-ink-faint leading-relaxed">{b}</p>
            </li>
          ))}
        </ul>
      </Card>

      {/* Verified addresses */}
      <section>
        <SectionTitle>Verified contract addresses</SectionTitle>
        <SectionDesc>
          The registry address per network — the single source of truth. Everything else is
          resolved on-chain from these.
        </SectionDesc>
        <div className="mt-3 grid sm:grid-cols-2 gap-3">
          <AddressCard network="Ethereum mainnet" chainId={mainnet.id} address={MAINNET} explorer="https://etherscan.io" />
          <AddressCard network="Sepolia testnet" chainId={sepolia.id} address={SEPOLIA} explorer="https://sepolia.etherscan.io" />
        </div>
        <div className="mt-3">
          <CodeBlock lang="TypeScript · config" code={ADDRESSES} />
        </div>
      </section>

      <Step n={1} title="Install">
        <SectionDesc>wagmi + viem for chain access, and the Zama relayer SDK for encryption/decryption.</SectionDesc>
        <CodeBlock lang="bash" code={INSTALL} className="mt-3" />
      </Step>

      <Step n={2} title="Read every pair from the registry">
        <SectionDesc>One length call + a slice call returns every pair, including revoked ones. Filter by <code className="font-mono text-ink-muted">isValid</code> before enabling actions.</SectionDesc>
        <CodeBlock lang="TypeScript · wagmi" code={READ_PAIRS} className="mt-3" />
      </Step>

      <Step n={3} title="Resolve one token → its confidential twin">
        <SectionDesc>Skip the full list when you already know the ERC-20 you care about.</SectionDesc>
        <CodeBlock lang="TypeScript · wagmi" code={RESOLVE_ONE} className="mt-3" />
      </Step>

      <Step n={4} title="Wrap a public token into its confidential twin">
        <SectionDesc>Approve, then wrap. The returned balance is an encrypted <code className="font-mono text-ink-muted">euint64</code> handle — only the holder can read it.</SectionDesc>
        <CodeBlock lang="TypeScript · viem" code={WRAP} className="mt-3" />
      </Step>

      <Step n={5} title="Reveal a confidential balance (EIP-712 user-decrypt)">
        <SectionDesc>The balance is an opaque handle on-chain. One wallet signature opens a time-boxed session; the relayer returns the cleartext to that user only — never publicly.</SectionDesc>
        <CodeBlock lang="TypeScript · relayer-sdk" code={REVEAL} className="mt-3" />
      </Step>

      <Step n={6} title="Unwrap back to the public ERC-20">
        <SectionDesc>Two-phase: submit an encrypted amount to burn, then finalize once the relayer has decrypted it — that releases the underlying token.</SectionDesc>
        <CodeBlock lang="TypeScript · relayer-sdk" code={UNWRAP} className="mt-3" />
      </Step>

      <Step n={7} title="Faucet (Sepolia only)">
        <SectionDesc>Zama's mock underlying tokens expose a public mint on the testnet so you can try the full loop risk-free.</SectionDesc>
        <CodeBlock lang="TypeScript · viem" code={FAUCET} className="mt-3" />
      </Step>

      <section id="add-pair" className="scroll-mt-20">
        <Step n={8} title="Add a pair (hybrid registry)">
          <SectionDesc>No hardcoded token list means no code surgery. On-chain pairs appear automatically; local/dev pairs merge from a config array — build yours below, verified on-chain.</SectionDesc>
          <CodeBlock lang="TypeScript · config" code={ADD_PAIR} className="mt-3" />
          <div className="mt-4">
            <AddPairSection />
          </div>
        </Step>
      </section>

      {/* Resources */}
      <Card className="p-5">
        <h2 className="text-sm font-semibold text-ink">Resources</h2>
        <div className="mt-3 grid sm:grid-cols-2 gap-2">
          {[
            ["Wrappers Registry docs", "https://docs.zama.org/protocol/protocol-apps/confidential-tokens/wrapper-registry"],
            ["Relayer SDK reference", "https://docs.zama.org/protocol/sdk"],
            ["FHEVM Solidity guides", "https://docs.zama.org/protocol/solidity-guides/getting-started/quick-start-tutorial"],
            ["OpenZeppelin Confidential Contracts (ERC-7984)", "https://github.com/OpenZeppelin/openzeppelin-confidential-contracts"],
          ].map(([label, href]) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between gap-2 rounded-input border border-line bg-elevate/[0.02] px-3.5 py-2.5 text-13 text-ink-muted hover:text-ink hover:border-line-strong transition-colors"
            >
              {label}
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-ink-faint group-hover:text-ink transition-colors shrink-0" fill="none" aria-hidden="true">
                <path d="M9 3h4v4M13 3 7 9M7 4H4a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* --- small building blocks --- */

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section>
      <div className="flex items-center gap-2.5">
        <span className="grid place-items-center h-6 w-6 rounded-pill border border-line bg-elevate/[0.04] text-2xs font-mono text-ink-muted shrink-0">
          {n}
        </span>
        <h2 className="text-base font-semibold text-ink tracking-tight">{title}</h2>
      </div>
      <div className="mt-2 pl-[34px]">{children}</div>
    </section>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-base font-semibold text-ink tracking-tight">{children}</h2>;
}
function SectionDesc({ children }: { children: ReactNode }) {
  return <p className="text-13 text-ink-faint leading-relaxed max-w-[75ch]">{children}</p>;
}

function AddressCard({
  network,
  chainId,
  address,
  explorer,
}: {
  network: string;
  chainId: number;
  address: string;
  explorer: string;
}) {
  return (
    <div className="rounded-input border border-line bg-elevate/[0.02] p-3.5">
      <div className="flex items-center justify-between">
        <span className="text-13 font-medium text-ink">{network}</span>
        <span className="font-mono text-2xs text-ink-faint">chain {chainId}</span>
      </div>
      <a
        href={`${explorer}/address/${address}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1.5 block font-mono text-2xs text-ink-muted hover:text-ink break-all transition-colors"
      >
        {address} ↗
      </a>
    </div>
  );
}
