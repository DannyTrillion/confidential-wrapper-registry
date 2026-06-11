/**
 * Token logos from the clean, uniform `cryptocurrency-icons` set (crisp flat
 * circular marks — the same style across every token). Symbols the set doesn't
 * include (ZAMA, BRON, tGBP, XAUt, bbqTGBP) return null and the UI renders a
 * deterministic ticker "monogram" badge instead. The mock / confidential
 * variants (USDCMock, cUSDCMock) resolve to the same underlying icon.
 */
const CDN =
  "https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/128/color";

const KNOWN: Record<string, string> = {
  usdc: "usdc",
  usdt: "usdt",
  dai: "dai",
  weth: "eth",
  eth: "eth",
  wbtc: "btc",
  btc: "btc",
  usds: "usdc",
  busd: "busd",
};

/** Candidate lookup keys: the symbol, minus a "Mock" suffix and an optional
 *  confidential "c" prefix (cUSDC → usdc, cWETH → weth). */
function candidates(symbol: string): string[] {
  const s = symbol.trim().replace(/mock$/i, "");
  const keys = [s.toLowerCase()];
  if (/^c./.test(s)) keys.push(s.slice(1).toLowerCase());
  return keys;
}

/** Clean logo URL for a token symbol, or null if the icon set lacks it. */
export function tokenLogo(symbol?: string): string | null {
  if (!symbol) return null;
  for (const key of candidates(symbol)) {
    if (KNOWN[key]) return `${CDN}/${KNOWN[key]}.png`;
  }
  return null;
}

/** A short deterministic ticker for the monogram badge (BRON, bbqTGBP → TGBP). */
export function tokenMonogram(symbol?: string): string {
  if (!symbol) return "?";
  const s = symbol.trim().replace(/mock$/i, "");
  const caps = s.replace(/[^A-Z]/g, ""); // uppercase letters drop "c"/"bbq"/lowercase noise
  if (caps.length >= 2 && caps.length <= 5) return caps;
  return s.replace(/^c/, "").slice(0, 4).toUpperCase() || "?";
}
