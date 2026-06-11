import { ethers, network } from "hardhat";

/**
 * Deploys a fresh ERC-20 + its ERC-7984 confidential wrapper — a pair that is
 * NOT in the onchain Wrappers Registry — to demonstrate the app's hybrid
 * registry. After running, paste the two printed addresses into
 * `lib/registry/customPairs.ts` and the pair appears in the app tagged "Local",
 * fully functional (wrap / unwrap / reveal).
 *
 * Usage:
 *   SEPOLIA_RPC_URL=...  DEPLOYER_PRIVATE_KEY=0x...  npm run deploy:custom
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  if (!deployer) {
    throw new Error("No deployer account — set DEPLOYER_PRIVATE_KEY in your env.");
  }
  console.log(`Network: ${network.name}`);
  console.log(`Deployer: ${deployer.address}\n`);

  // 6-decimal underlying so the confidential wrapper's 6-decimal cap means a 1:1
  // wrap rate — the cleanest pair to demo.
  const Mock = await ethers.getContractFactory("MockERC20");
  const underlying = await Mock.deploy("Demo USD", "DEMOUSD", 6);
  await underlying.waitForDeployment();
  const underlyingAddr = await underlying.getAddress();
  console.log(`✓ MockERC20  DEMOUSD        ${underlyingAddr}`);

  const Wrapper = await ethers.getContractFactory("ConfidentialMockWrapper");
  const wrapper = await Wrapper.deploy(underlyingAddr, "Confidential Demo USD", "cDEMOUSD");
  await wrapper.waitForDeployment();
  const wrapperAddr = await wrapper.getAddress();
  console.log(`✓ Wrapper    cDEMOUSD       ${wrapperAddr}`);

  // Seed the deployer with some underlying so the pair is immediately wrappable.
  await (await underlying.mint(deployer.address, ethers.parseUnits("1000000", 6))).wait();
  console.log(`✓ Minted 1,000,000 DEMOUSD to ${deployer.address}\n`);

  console.log("Paste into lib/registry/customPairs.ts under the matching chain id:\n");
  console.log(`  { token: "${underlyingAddr}", confidentialToken: "${wrapperAddr}" },\n`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
