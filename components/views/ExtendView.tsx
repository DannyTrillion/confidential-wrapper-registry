"use client";

import { useMemo, useState } from "react";
import { isAddress, getAddress, zeroAddress, type Address } from "viem";
import { useConfig } from "wagmi";
import { getPublicClient } from "wagmi/actions";
import { mainnet, sepolia } from "wagmi/chains";
import { useExplorerNetwork } from "@/components/NetworkContext";
import { getNetwork, type SupportedChainId } from "@/lib/networks";
import { ERC20_ABI, ERC7984_WRAPPER_ABI } from "@/lib/abis";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TokenIcon } from "@/components/fx/TokenIcon";
import { PageGuide } from "@/components/learn/PageGuide";
import { PageHeader } from "./BalancesView";
import { cn } from "@/lib/cn";

interface SideMeta {
  symbol?: string;
  decimals?: number;
  ok: boolean;
}
interface VerifyResult {
  token: SideMeta;
  conf: SideMeta & { isErc7984: boolean };
}

export function ExtendView() {
  const config = useConfig();
  const { chainId: explorerChain } = useExplorerNetwork();
  const [chain, setChain] = useState<SupportedChainId>(explorerChain);
  const [tokenInput, setTokenInput] = useState("");
  const [confInput, setConfInput] = useState("");
  const [status, setStatus] = useState<"idle" | "checking" | "done">("idle");
  const [result, setResult] = useState<VerifyResult | null>(null);

  const tokenValid = isAddress(tokenInput.trim());
  const confValid = isAddress(confInput.trim());
  const bothValid = tokenValid && confValid;

  const snippet = useMemo(() => {
    if (!bothValid) return null;
    const t = getAddress(tokenInput.trim());
    const c = getAddress(confInput.trim());
    const key = chain === mainnet.id ? "mainnet" : "sepolia";
    return `// lib/registry/customPairs.ts → CUSTOM_PAIRS[${key}.id]\n{ token: "${t}", confidentialToken: "${c}" },`;
  }, [bothValid, tokenInput, confInput, chain]);

  async function verify() {
    if (!bothValid) return;
    setStatus("checking");
    setResult(null);
    try {
      const client = getPublicClient(config, { chainId: chain });
      if (!client) throw new Error("no client");
      const token = getAddress(tokenInput.trim());
      const conf = getAddress(confInput.trim());
      const res = await client.multicall({
        allowFailure: true,
        contracts: [
          { address: token, abi: ERC20_ABI, functionName: "symbol" },
          { address: token, abi: ERC20_ABI, functionName: "decimals" },
          { address: conf, abi: ERC7984_WRAPPER_ABI, functionName: "symbol" },
          { address: conf, abi: ERC7984_WRAPPER_ABI, functionName: "decimals" },
          { address: conf, abi: ERC7984_WRAPPER_ABI, functionName: "confidentialBalanceOf", args: [zeroAddress] },
        ],
      });
      const ok = (i: number) => res[i]?.status === "success";
      setResult({
        token: {
          symbol: ok(0) ? (res[0].result as string) : undefined,
          decimals: ok(1) ? Number(res[1].result) : undefined,
          ok: ok(0) && ok(1),
        },
        conf: {
          symbol: ok(2) ? (res[2].result as string) : undefined,
          decimals: ok(3) ? Number(res[3].result) : undefined,
          ok: ok(2) && ok(3),
          isErc7984: ok(4),
        },
      });
    } catch {
      setResult(null);
    } finally {
      setStatus("done");
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Add a token pair"
        subtitle="The registry is extensible by design. Surface any ERC-20 ↔ ERC-7984 pair — register it on-chain so everyone sees it, or declare it locally for custom and dev-only tokens."
      />

      <PageGuide
        id="extend"
        intro="The app reads the official registry live from the blockchain, and merges in any local pairs on top — a hybrid registry. There's no hardcoded token list, so new pairs need no code surgery."
        points={[
          { label: "Local = self-serve", body: "Add one line to a config file for any pair — custom or not-yet-registered. It appears tagged “Local”, fully wrappable and revealable. No permission needed; works in your own instance instantly." },
          { label: "On-chain = canonical", body: "A pair registered on the Wrappers Registry shows up here automatically — zero code, for everyone. The official registry is curated (owner-only), so this path goes through Zama, or your own registry." },
          { label: "On-chain truth wins", body: "If a local pair is later registered on-chain, the on-chain entry takes over automatically. You only ever supply two addresses — metadata is resolved live." },
        ]}
      />

      {/* Interactive builder */}
      <Card className="p-5 sm:p-6 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-ink">Build your config entry</h2>
          <p className="text-13 text-ink-faint mt-0.5">
            Paste the two addresses, verify them on-chain, and copy the exact line to add.
          </p>
        </div>

        {/* network toggle */}
        <div className="inline-flex items-center gap-1 rounded-pill border border-line bg-base/50 p-0.5">
          {[sepolia.id, mainnet.id].map((id) => (
            <button
              key={id}
              onClick={() => {
                setChain(id as SupportedChainId);
                setResult(null);
                setStatus("idle");
              }}
              className={cn(
                "px-3 h-7 rounded-pill text-2xs font-medium transition-colors",
                chain === id ? "bg-accent text-[#0a0a0a]" : "text-ink-faint hover:text-ink",
              )}
            >
              {getNetwork(id)?.name}
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <AddressField label="Public token — ERC-20 address" value={tokenInput} onChange={setTokenInput} valid={tokenValid} />
          <AddressField label="Confidential token — ERC-7984 wrapper address" value={confInput} onChange={setConfInput} valid={confValid} />
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={verify} disabled={!bothValid} loading={status === "checking"}>
            Verify on-chain
          </Button>
          {status === "done" && result && (
            <span className="text-2xs text-ink-faint">on {getNetwork(chain)?.name}</span>
          )}
        </div>

        {/* verification result */}
        {status === "done" && result && (
          <div className="grid sm:grid-cols-2 gap-3">
            <SidePreview meta={result.token} kind="ERC-20" />
            <SidePreview meta={result.conf} kind="ERC-7984" isErc7984={result.conf.isErc7984} confidential />
          </div>
        )}

        {/* snippet */}
        {snippet && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-2xs uppercase tracking-wide text-ink-faint">Copy into customPairs.ts</span>
              <CopyButton text={snippet.split("\n")[1]} />
            </div>
            <pre className="rounded-input border border-line bg-base/60 p-3 text-2xs leading-relaxed font-mono text-ink-muted overflow-x-auto whitespace-pre">
              {snippet}
            </pre>
            <p className="mt-1.5 text-2xs text-ink-faint">
              Add it under the matching chain in{" "}
              <span className="font-mono text-ink-muted">CUSTOM_PAIRS</span>, save, and reload — it appears tagged “Local”.
            </p>
          </div>
        )}
      </Card>

      {/* Three methods */}
      <section>
        <h2 className="text-sm font-semibold text-ink mb-3">The three ways to add a pair</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          <MethodCard
            n={1}
            title="Register on-chain"
            body="Call registerConfidentialToken(erc20, wrapper) → canonical for everyone, no code change. The official registry is owner-curated, so this goes through Zama (or a registry you deploy yourself)."
          />
          <MethodCard
            n={2}
            title="Declare locally"
            body="Add the one line above to lib/registry/customPairs.ts. Best for custom or not-yet-registered pairs. Tagged “Local”."
          />
          <MethodCard
            n={3}
            title="Deploy a fresh pair"
            body="Don't have a pair yet? One command deploys an ERC-20 + its ERC-7984 wrapper to Sepolia and prints the line to paste."
          >
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] uppercase tracking-wide text-ink-ghost">in contracts/</span>
                <CopyButton text="npm run deploy:custom" />
              </div>
              <pre className="rounded-input border border-line bg-base/60 p-2.5 text-[11px] font-mono text-ink-muted overflow-x-auto">npm run deploy:custom</pre>
            </div>
          </MethodCard>
        </div>
      </section>

      {/* Honest note on which path is actually self-serve. */}
      <div className="rounded-card border border-accent/20 bg-accent-faint p-4 flex items-start gap-3">
        <svg viewBox="0 0 18 18" className="h-4 w-4 mt-0.5 shrink-0 text-accentInk" fill="none" aria-hidden="true">
          <circle cx="9" cy="9" r="6.8" stroke="currentColor" strokeWidth="1.3" />
          <path d="M9 8.2v4M9 5.8h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <p className="text-13 text-ink-muted leading-relaxed">
          <strong className="text-ink">Which path is for me?</strong> Surfacing a pair in your own instance is fully
          self-serve — use the local config above, no permission needed, live in minutes. Getting onto the{" "}
          <em>official, shared</em> registry is curated: that contract is owner-only (which is what makes it a trusted
          list), so on-chain registration goes through Zama — or you register permissionlessly on a{" "}
          <span className="font-mono text-ink-faint">WrappersRegistry</span> you deploy yourself and point a fork at.
        </p>
      </div>
    </div>
  );
}

function AddressField({
  label,
  value,
  onChange,
  valid,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  valid: boolean;
}) {
  const show = value.trim().length > 0;
  return (
    <div>
      <label className="text-2xs uppercase tracking-wide text-ink-faint">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0x…"
        spellCheck={false}
        className={cn(
          "mt-1 w-full h-10 px-3 rounded-input bg-base border text-13 font-mono text-ink placeholder:text-ink-ghost outline-none transition-colors",
          show && !valid ? "border-danger/50" : "border-line focus-visible:border-accent/50",
        )}
      />
      {show && !valid && <p className="mt-1 text-2xs text-danger">That doesn&apos;t look like an address.</p>}
    </div>
  );
}

function SidePreview({
  meta,
  kind,
  isErc7984,
  confidential,
}: {
  meta: SideMeta;
  kind: string;
  isErc7984?: boolean;
  confidential?: boolean;
}) {
  return (
    <div className="rounded-input border border-line glass-soft p-3">
      <div className="text-2xs text-ink-faint uppercase tracking-wide mb-2">{kind}</div>
      {meta.ok ? (
        <div className="flex items-center gap-2.5">
          <TokenIcon symbol={meta.symbol} confidential={confidential} size={28} />
          <div className="min-w-0">
            <div className="font-mono text-13 text-ink truncate">{meta.symbol ?? "—"}</div>
            <div className="text-2xs text-ink-faint">{meta.decimals != null ? `${meta.decimals} decimals` : ""}</div>
          </div>
        </div>
      ) : (
        <p className="text-2xs text-danger">Couldn&apos;t read this token on this network.</p>
      )}
      {confidential && (
        <p className={cn("mt-2 text-2xs", isErc7984 ? "text-ok" : "text-warn")}>
          {isErc7984 ? "✓ Exposes a confidential balance (ERC-7984)" : "⚠ No confidentialBalanceOf — may not be an ERC-7984"}
        </p>
      )}
    </div>
  );
}

function MethodCard({
  n,
  title,
  body,
  children,
}: {
  n: number;
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-card border border-line glass-soft p-4">
      <div className="flex items-center gap-2.5">
        <span className="grid place-items-center h-6 w-6 rounded-pill bg-accent/15 text-accentInk text-2xs font-semibold">{n}</span>
        <h3 className="text-13 font-medium text-ink">{title}</h3>
      </div>
      <p className="mt-2 text-13 text-ink-faint leading-relaxed">{body}</p>
      {children}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* clipboard blocked */
        }
      }}
      className="inline-flex items-center gap-1 text-2xs text-ink-faint hover:text-accentInk transition-colors"
    >
      {copied ? (
        <>
          <svg viewBox="0 0 14 14" className="h-3 w-3" fill="none" aria-hidden="true">
            <path d="m3 7.5 2.5 2.5L11 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Copied
        </>
      ) : (
        <>
          <svg viewBox="0 0 14 14" className="h-3 w-3" fill="none" aria-hidden="true">
            <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M2.5 8.5V2.5a1 1 0 0 1 1-1h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          Copy
        </>
      )}
    </button>
  );
}
