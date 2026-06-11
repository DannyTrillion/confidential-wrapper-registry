import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";
import { expect } from "chai";
import { ZeroHash, parseUnits } from "ethers";
import type { Signer } from "ethers";

/**
 * ERC-7984 wrap / decrypt / unwrap against the FHEVM mock node. These mirror
 * the exact flows the frontend drives (wrap, confidentialBalanceOf → userDecrypt,
 * unwrap burn) and prove the decimals/rate handling the UI must not hardcode.
 */
describe("ConfidentialMockWrapper (wrap / decrypt / unwrap)", () => {
  async function deploy(decimals: number) {
    const [deployer, alice, bob] = await ethers.getSigners();

    const Mock = await ethers.getContractFactory("MockERC20");
    const underlying = await Mock.deploy("Mock USD", "mUSD", decimals);
    await underlying.waitForDeployment();

    const Wrapper = await ethers.getContractFactory("ConfidentialMockWrapper");
    const wrapper = await Wrapper.deploy(await underlying.getAddress(), "Confidential mUSD", "cmUSD");
    await wrapper.waitForDeployment();

    return { deployer, alice, bob, underlying, wrapper };
  }

  async function decryptBalance(wrapper: any, who: string, signer: Signer): Promise<bigint> {
    const handle = await wrapper.confidentialBalanceOf(who);
    if (handle === ZeroHash) return 0n;
    return fhevm.userDecryptEuint(FhevmType.euint64, handle, await wrapper.getAddress(), signer);
  }

  beforeEach(function () {
    if (!fhevm.isMock) this.skip(); // mock-only
  });

  it("wraps a 6-decimal token at rate 1 (confidential decimals = 6)", async () => {
    const { alice, underlying, wrapper } = await deploy(6);
    expect(await wrapper.decimals()).to.eq(6);
    expect(await wrapper.rate()).to.eq(1n);

    const amount = parseUnits("100", 6);
    await underlying.mint(alice.address, amount);
    await underlying.connect(alice).approve(await wrapper.getAddress(), amount);
    await wrapper.connect(alice).wrap(alice.address, amount);

    expect(await decryptBalance(wrapper, alice.address, alice)).to.eq(amount);
  });

  it("wraps an 18-decimal token at rate 1e12 (decimals capped at 6) — never hardcode 18", async () => {
    const { alice, underlying, wrapper } = await deploy(18);
    expect(await wrapper.decimals()).to.eq(6);
    expect(await wrapper.rate()).to.eq(10n ** 12n);

    const amount = parseUnits("3", 18); // 3 whole tokens
    await underlying.mint(alice.address, amount);
    await underlying.connect(alice).approve(await wrapper.getAddress(), amount);
    await wrapper.connect(alice).wrap(alice.address, amount);

    // Confidential balance is in 6-decimal units: 3e18 / 1e12 = 3e6.
    expect(await decryptBalance(wrapper, alice.address, alice)).to.eq(parseUnits("3", 6));
  });

  it("treats a never-initialized balance as bytes32(0) — the 'no balance yet' case", async () => {
    const { bob, wrapper } = await deploy(6);
    const handle = await wrapper.confidentialBalanceOf(bob.address);
    expect(handle).to.eq(ZeroHash); // frontend shows "No balance yet", never decrypts this
  });

  it("burns on unwrap and emits UnwrapRequested (phase 1 of the two-phase withdrawal)", async () => {
    const { alice, underlying, wrapper } = await deploy(6);
    const amount = parseUnits("100", 6);
    await underlying.mint(alice.address, amount);
    await underlying.connect(alice).approve(await wrapper.getAddress(), amount);
    await wrapper.connect(alice).wrap(alice.address, amount);
    expect(await decryptBalance(wrapper, alice.address, alice)).to.eq(amount);

    // Encrypt the burn amount bound to (wrapper, alice), then unwrap.
    const wrapperAddr = await wrapper.getAddress();
    const burn = parseUnits("40", 6);
    const enc = await fhevm.createEncryptedInput(wrapperAddr, alice.address).add64(burn).encrypt();

    await expect(
      wrapper
        .connect(alice)
        ["unwrap(address,address,bytes32,bytes)"](alice.address, alice.address, enc.handles[0], enc.inputProof),
    ).to.emit(wrapper, "UnwrapRequested");

    // Confidential balance dropped by the burned amount (finalize then releases
    // the underlying — that phase needs the relayer's KMS proof, covered E2E
    // against live Sepolia, not the mock).
    expect(await decryptBalance(wrapper, alice.address, alice)).to.eq(amount - burn);
  });

  it("exposes underlying() so the wrapper is self-describing for the registry", async () => {
    const { underlying, wrapper } = await deploy(6);
    expect(await wrapper.underlying()).to.eq(await underlying.getAddress());
  });
});
