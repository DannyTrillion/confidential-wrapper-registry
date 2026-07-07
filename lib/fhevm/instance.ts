"use client";

/**
 * Per-network FHEVM relayer-SDK instances. initSDK() loads the WASM exactly once
 * (process-wide); createInstance() is memoized per chain so decryption works on
 * BOTH Sepolia and Ethereum mainnet.
 */
import type { FhevmInstance } from "@zama-fhe/relayer-sdk/web";
import { mainnet, sepolia } from "wagmi/chains";

type DecryptChainId = typeof mainnet.id | typeof sepolia.id;

/**
 * Reliable RPCs for the SDK's *setup reads* (ACL/verifier `eip712Domain`, FHE
 * public key). We do NOT use the wallet's injected provider — it rate-limits and
 * intermittently returns `0x`, surfacing as `could not decode result data …
 * eip712Domain()`. Signing still goes through the wallet (via the EIP-1193
 * provider in the decrypt session). Set NEXT_PUBLIC_*_RPC_URL for production.
 */
const RPC: Record<DecryptChainId, string> = {
  [sepolia.id]:
    process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ?? "https://ethereum-sepolia-rpc.publicnode.com",
  [mainnet.id]: process.env.NEXT_PUBLIC_MAINNET_RPC_URL ?? "https://ethereum-rpc.publicnode.com",
};

const instances = new Map<DecryptChainId, FhevmInstance>();
const creating = new Map<DecryptChainId, Promise<FhevmInstance>>();
let _initPromise: Promise<unknown> | null = null;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function isDecryptSupported(chainId: number | undefined): chainId is DecryptChainId {
  return chainId === mainnet.id || chainId === sepolia.id;
}

export async function getFhevmInstance(chainId: DecryptChainId): Promise<FhevmInstance> {
  const cached = instances.get(chainId);
  if (cached) return cached;
  const inflight = creating.get(chainId);
  if (inflight) return inflight;

  const promise = (async () => {
    // `/web` ESM build for bundlers (Next/webpack). `/bundle` is a CDN shim that
    // reads `window.relayerSDK` and throws under webpack.
    const { initSDK, createInstance, SepoliaConfig, MainnetConfig } = await import(
      "@zama-fhe/relayer-sdk/web"
    );
    _initPromise ??= initSDK();
    await _initPromise;

    if (typeof window === "undefined") {
      throw new Error("FHEVM relayer is only available in the browser.");
    }

    const base = chainId === mainnet.id ? MainnetConfig : SepoliaConfig;
    // Mainnet's hosted relayer requires an `x-api-key` — which must never ship
    // to the browser (Zama security guidance). All mainnet relayer traffic goes
    // through our backend proxy, which injects the key server-side. Sepolia's
    // relayer is open and is called directly.
    const config = {
      ...base,
      network: RPC[chainId],
      ...(chainId === mainnet.id
        ? { relayerUrl: `${window.location.origin}/api/relayer` }
        : {}),
    } as Parameters<typeof createInstance>[0];

    // Setup reads can transiently return `0x` on public RPCs; retry a few times.
    let lastErr: unknown;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const inst = await createInstance(config);
        instances.set(chainId, inst);
        return inst;
      } catch (err) {
        lastErr = err;
        if (attempt < 2) await sleep(500 * (attempt + 1));
      }
    }
    throw lastErr;
  })();

  creating.set(chainId, promise);
  try {
    return await promise;
  } finally {
    creating.delete(chainId);
  }
}

export function isFhevmReady(chainId: DecryptChainId): boolean {
  return instances.has(chainId);
}
