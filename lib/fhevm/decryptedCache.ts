/**
 * Process-wide cache of decrypted balances, keyed by ciphertext handle. A handle
 * uniquely identifies a ciphertext, so its cleartext is stable — once any screen
 * (Decrypt tab, Portfolio, Unwrap) reveals a balance, every other screen can reuse
 * the value with no extra signature. When a balance changes, its handle changes,
 * so a stale value never applies to a new balance.
 */
const cache = new Map<string, bigint>();

export function setDecryptedValue(handle: string | undefined, value: bigint) {
  if (handle) cache.set(handle.toLowerCase(), value);
}

export function getDecryptedValue(handle: string | undefined): bigint | undefined {
  return handle ? cache.get(handle.toLowerCase()) : undefined;
}

export function clearDecryptedValues() {
  cache.clear();
}
