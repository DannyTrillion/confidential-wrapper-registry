import { ethers } from "hardhat";
import { expect } from "chai";
import { ZeroAddress, getAddress } from "ethers";

/**
 * Registry read-surface tests. These validate the exact assumptions the
 * frontend's read layer (lib/registry/useRegistry.ts) makes:
 *  - length + slice pagination (fromIndex incl, toIndex excl)
 *  - getConfidentialTokenAddress tuple shape
 *  - revoked pairs are RETAINED and still returned by slices (isValid=false)
 */
describe("WrappersRegistry (frontend read-layer contract)", () => {
  async function deploy() {
    const Registry = await ethers.getContractFactory("WrappersRegistry");
    const registry = await Registry.deploy();
    await registry.waitForDeployment();
    return registry;
  }

  // Deterministic fake token/wrapper addresses (EIP-55 checksummed to match
  // what the contract returns).
  const T = (n: number) => getAddress(`0x${n.toString(16).padStart(40, "0")}`);

  it("starts empty", async () => {
    const registry = await deploy();
    expect(await registry.getTokenConfidentialTokenPairsLength()).to.eq(0n);
  });

  it("registers pairs and grows length", async () => {
    const registry = await deploy();
    await expect(registry.registerConfidentialToken(T(1), T(1001)))
      .to.emit(registry, "ConfidentialTokenRegistered")
      .withArgs(T(1), T(1001));
    await registry.registerConfidentialToken(T(2), T(1002));
    expect(await registry.getTokenConfidentialTokenPairsLength()).to.eq(2n);
  });

  it("slices with fromIndex inclusive, toIndex exclusive", async () => {
    const registry = await deploy();
    for (let i = 1; i <= 5; i++) await registry.registerConfidentialToken(T(i), T(1000 + i));

    const slice = await registry.getTokenConfidentialTokenPairsSlice(1, 3);
    expect(slice.length).to.eq(2); // indices 1,2 — not 3
    expect(slice[0].tokenAddress).to.eq(T(2));
    expect(slice[1].tokenAddress).to.eq(T(3));
  });

  it("returns the full set when slicing [0, length)", async () => {
    const registry = await deploy();
    for (let i = 1; i <= 3; i++) await registry.registerConfidentialToken(T(i), T(1000 + i));
    const len = await registry.getTokenConfidentialTokenPairsLength();
    const all = await registry.getTokenConfidentialTokenPairsSlice(0, len);
    expect(all.map((p) => p.confidentialTokenAddress)).to.deep.eq([T(1001), T(1002), T(1003)]);
  });

  it("resolves a confidential token by underlying", async () => {
    const registry = await deploy();
    await registry.registerConfidentialToken(T(7), T(1007));
    const [isValid, confidential] = await registry.getConfidentialTokenAddress(T(7));
    expect(isValid).to.eq(true);
    expect(confidential).to.eq(T(1007));
  });

  it("returns (false, zero) for an unknown token", async () => {
    const registry = await deploy();
    const [isValid, confidential] = await registry.getConfidentialTokenAddress(T(999));
    expect(isValid).to.eq(false);
    expect(confidential).to.eq(ZeroAddress);
  });

  it("RETAINS revoked pairs in storage with isValid=false (history preserved)", async () => {
    const registry = await deploy();
    await registry.registerConfidentialToken(T(1), T(1001));
    await registry.registerConfidentialToken(T(2), T(1002));

    await expect(registry.revokeConfidentialToken(T(1002)))
      .to.emit(registry, "ConfidentialTokenRevoked")
      .withArgs(T(2), T(1002));

    // Length unchanged — revocation never deletes.
    expect(await registry.getTokenConfidentialTokenPairsLength()).to.eq(2n);

    const slice = await registry.getTokenConfidentialTokenPairsSlice(0, 2);
    expect(slice[1].confidentialTokenAddress).to.eq(T(1002));
    expect(slice[1].isValid).to.eq(false); // still present, flagged revoked

    const [isValid] = await registry.getConfidentialTokenAddress(T(2));
    expect(isValid).to.eq(false);
  });

  it("prevents double registration", async () => {
    const registry = await deploy();
    await registry.registerConfidentialToken(T(1), T(1001));
    await expect(registry.registerConfidentialToken(T(1), T(9999))).to.be.revertedWithCustomError(
      registry,
      "AlreadyRegistered",
    );
  });
});
