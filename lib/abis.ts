/**
 * Hand-written ABI fragments. Only the functions/events the app actually calls
 * are included — kept minimal and typed via viem's `as const`.
 *
 * Sources (verified, not guessed):
 *  - Registry: docs.zama.org/protocol/protocol-apps/confidential-tokens/wrapper-registry
 *  - ERC7984ERC20Wrapper: OpenZeppelin confidential-contracts v0.3.x
 *    (token/ERC7984/extensions/ERC7984ERC20Wrapper.sol)
 *  - Mock-USDC faucet: zama-ai mock ERC20 `mint(address,uint256)` (Sepolia)
 */

/** Confidential Token Wrappers Registry. */
export const REGISTRY_ABI = [
  {
    type: "function",
    name: "getTokenConfidentialTokenPairsLength",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "getTokenConfidentialTokenPairsSlice",
    stateMutability: "view",
    // fromIndex included, toIndex excluded.
    inputs: [
      { name: "fromIndex", type: "uint256" },
      { name: "toIndex", type: "uint256" },
    ],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        components: [
          { name: "tokenAddress", type: "address" },
          { name: "confidentialTokenAddress", type: "address" },
          { name: "isValid", type: "bool" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "getConfidentialTokenAddress",
    stateMutability: "view",
    inputs: [{ name: "token", type: "address" }],
    outputs: [
      { name: "isValid", type: "bool" },
      { name: "confidentialToken", type: "address" },
    ],
  },
  {
    type: "event",
    name: "ConfidentialTokenRegistered",
    inputs: [
      { name: "tokenAddress", type: "address", indexed: true },
      { name: "confidentialTokenAddress", type: "address", indexed: true },
    ],
  },
  {
    type: "event",
    name: "ConfidentialTokenRevoked",
    inputs: [
      { name: "tokenAddress", type: "address", indexed: true },
      { name: "confidentialTokenAddress", type: "address", indexed: true },
    ],
  },
] as const;

/** Minimal ERC-20 surface for the underlying token (metadata + approve + faucet). */
export const ERC20_ABI = [
  { type: "function", name: "name", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { type: "function", name: "symbol", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
  // Zama mock ERC-20 faucet path: public mint on the testnet mocks.
  {
    type: "function",
    name: "mint",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
] as const;

/**
 * ERC-7984 confidential token + the ERC-20 wrapper extension.
 * Balances are euint64 handles (returned as bytes32).
 */
export const ERC7984_WRAPPER_ABI = [
  // --- ERC-7984 metadata / balance ---
  { type: "function", name: "name", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { type: "function", name: "symbol", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
  {
    type: "function",
    name: "confidentialBalanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "bytes32" }],
  },
  {
    type: "function",
    name: "isOperator",
    stateMutability: "view",
    inputs: [
      { name: "holder", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    name: "setOperator",
    stateMutability: "nonpayable",
    inputs: [
      { name: "operator", type: "address" },
      { name: "until", type: "uint48" },
    ],
    outputs: [],
  },

  // --- Wrapper extension ---
  { type: "function", name: "underlying", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "rate", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  {
    type: "function",
    name: "wrap",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bytes32" }],
  },
  // Two unwrap overloads — we use the encrypted-input one from the browser.
  {
    type: "function",
    name: "unwrap",
    stateMutability: "nonpayable",
    inputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "encryptedAmount", type: "bytes32" },
      { name: "inputProof", type: "bytes" },
    ],
    outputs: [{ name: "", type: "bytes32" }],
  },
  {
    type: "function",
    name: "finalizeUnwrap",
    stateMutability: "nonpayable",
    inputs: [
      { name: "unwrapRequestId", type: "bytes32" },
      { name: "unwrapAmountCleartext", type: "uint64" },
      { name: "decryptionProof", type: "bytes" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "unwrapAmount",
    stateMutability: "view",
    inputs: [{ name: "unwrapRequestId", type: "bytes32" }],
    outputs: [{ name: "", type: "bytes32" }],
  },
  {
    type: "function",
    name: "unwrapRequester",
    stateMutability: "view",
    inputs: [{ name: "unwrapRequestId", type: "bytes32" }],
    outputs: [{ name: "", type: "address" }],
  },
  // Verified against IERC7984ERC20Wrapper: BOTH receiver and unwrapRequestId are
  // indexed; the euint64 fields are bytes32 on the wire.
  {
    type: "event",
    name: "UnwrapRequested",
    inputs: [
      { name: "receiver", type: "address", indexed: true },
      { name: "unwrapRequestId", type: "bytes32", indexed: true },
      { name: "amount", type: "bytes32", indexed: false },
    ],
  },
  {
    type: "event",
    name: "UnwrapFinalized",
    inputs: [
      { name: "receiver", type: "address", indexed: true },
      { name: "unwrapRequestId", type: "bytes32", indexed: true },
      { name: "encryptedAmount", type: "bytes32", indexed: false },
      { name: "cleartextAmount", type: "uint64", indexed: false },
    ],
  },
] as const;

/** The all-zero handle: an uninitialized confidential balance ("no balance yet"). */
export const ZERO_HANDLE =
  "0x0000000000000000000000000000000000000000000000000000000000000000" as const;
