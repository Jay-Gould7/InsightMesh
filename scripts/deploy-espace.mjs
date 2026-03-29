import hre from "hardhat";
import dotenv from "dotenv";

dotenv.config();

const { ethers } = hre;

async function main() {
  await hre.run("compile");

  const [deployer] = await ethers.getSigners();
  const tokenAddress = process.env.ESPACE_USDT0_ADDRESS;
  let finalTokenAddress = tokenAddress;

  if (!finalTokenAddress) {
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const token = await MockERC20.deploy("Mock USDT0", "mUSDT0", 6);
    await token.waitForDeployment();
    finalTokenAddress = await token.getAddress();
    console.log(`Mock USDT0 deployed: ${finalTokenAddress}`);
  }

  const RewardVault = await ethers.getContractFactory("RewardVault");
  const rewardVault = await RewardVault.deploy(finalTokenAddress, deployer.address);
  await rewardVault.waitForDeployment();

  console.log(JSON.stringify({
    tokenAddress: finalTokenAddress,
    rewardVault: await rewardVault.getAddress(),
    admin: deployer.address,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
