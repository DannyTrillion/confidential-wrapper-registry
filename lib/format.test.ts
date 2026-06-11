import { describe, it, expect } from "vitest";
import { truncateAddress, formatAmount, sameAddress, humanizeError } from "./format";

const ADDR = "0x2f0750Bbb0A246059d80e94c454586a7F27a128e";

describe("truncateAddress", () => {
  it("truncates the middle to 0x1234…AB12 shape", () => {
    expect(truncateAddress(ADDR)).toBe("0x2f07…128e");
  });
  it("respects custom lead/tail", () => {
    expect(truncateAddress(ADDR, 4, 4)).toBe("0x2f…128e");
  });
  it("returns short strings unchanged", () => {
    expect(truncateAddress("0x1234")).toBe("0x1234");
  });
  it("handles undefined", () => {
    expect(truncateAddress(undefined)).toBe("");
  });
});

describe("formatAmount (decimals are never assumed)", () => {
  it("formats 6-decimal USDC with grouping", () => {
    expect(formatAmount(1_234_560_000n, 6)).toBe("1,234.56");
  });
  it("formats 18-decimal token", () => {
    expect(formatAmount(3_000_000_000_000_000_000n, 18)).toBe("3");
  });
  it("formats 8-decimal token (unusual decimals)", () => {
    expect(formatAmount(150_000_000n, 8)).toBe("1.5");
  });
  it("trims trailing zeros in the fraction", () => {
    expect(formatAmount(1_500_000n, 6)).toBe("1.5");
  });
  it("renders exact zero as 0", () => {
    expect(formatAmount(0n, 6)).toBe("0");
  });
  it("groups large whole numbers", () => {
    expect(formatAmount(1_000_000_000_000n, 6)).toBe("1,000,000");
  });
});

describe("sameAddress", () => {
  it("is case-insensitive", () => {
    expect(sameAddress(ADDR.toLowerCase(), ADDR.toUpperCase())).toBe(true);
  });
  it("is false for different addresses", () => {
    expect(sameAddress(ADDR, "0x0000000000000000000000000000000000000001")).toBe(false);
  });
  it("is false when either is missing", () => {
    expect(sameAddress(undefined, ADDR)).toBe(false);
  });
});

describe("humanizeError (maps known FHEVM/wallet failures to plain words)", () => {
  it("recognizes user rejection", () => {
    expect(humanizeError(new Error("User rejected the request"))).toMatch(/rejected the request/i);
  });
  it("recognizes the uninitialized-handle relayer error", () => {
    expect(humanizeError(new Error("Handle is not initialized"))).toMatch(/never initialized/i);
  });
  it("recognizes an unauthorized user-decrypt", () => {
    expect(humanizeError(new Error("User 0xabc is not authorized to user decrypt handle 0xdef"))).toMatch(
      /isn't authorized/i,
    );
  });
  it("recognizes insufficient gas funds", () => {
    expect(humanizeError(new Error("insufficient funds for gas"))).toMatch(/insufficient eth/i);
  });
  it("surfaces a contract revert reason", () => {
    expect(humanizeError(new Error(`execution reverted with reason string 'bad range'`))).toBe("bad range");
  });
  it("falls back gracefully on unknown errors", () => {
    expect(humanizeError({ weird: true })).toMatch(/something went wrong/i);
  });
});
