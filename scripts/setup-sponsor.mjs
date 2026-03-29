import dotenv from "dotenv";
import { Conflux } from "js-conflux-sdk";

dotenv.config();

function normalizePrivateKey(value) {
  if (!value) return value;
  return value.startsWith("0x") ? value : `0x${value}`;
}

async function main() {
  const rpcUrl = process.env.CONFLUX_CORE_RPC_URL || "https://test.confluxrpc.com";
  const networkId = Number(process.env.CONFLUX_CORE_NETWORK_ID || "1");
  const privateKey = normalizePrivateKey(process.env.CONFLUX_CORE_RELAYER_PRIVATE_KEY);
  const contractAddress = process.env.CONFLUX_CORE_SUBMISSION_ADDRESS;
  const upperBound = BigInt(process.env.SPONSOR_GAS_UPPER_BOUND || "1000000000000000");
  const gasValue = BigInt(process.env.SPONSOR_GAS_VALUE || "1000000000000000000");
  const collateralValue = BigInt(process.env.SPONSOR_COLLATERAL_VALUE || "1000000000000000000");

  if (!privateKey || !contractAddress) {
    throw new Error("Missing CONFLUX_CORE_RELAYER_PRIVATE_KEY or CONFLUX_CORE_SUBMISSION_ADDRESS");
  }

  if (gasValue < upperBound * 1000n) {
    throw new Error("SPONSOR_GAS_VALUE must be >= 1000 * SPONSOR_GAS_UPPER_BOUND");
  }

  const cfx = new Conflux({ url: rpcUrl, networkId });
  const account = cfx.wallet.addPrivateKey(privateKey);
  const sponsor = cfx.InternalContract("SponsorWhitelistControl");

  await sponsor.addPrivilegeByAdmin(contractAddress, ["0x0000000000000000000000000000000000000000"]).sendTransaction({ from: account.address }).executed();
  await sponsor.setSponsorForGas(contractAddress, upperBound).sendTransaction({ from: account.address, value: gasValue }).executed();
  await sponsor.setSponsorForCollateral(contractAddress).sendTransaction({ from: account.address, value: collateralValue }).executed();

  console.log(JSON.stringify({ contractAddress, upperBound: upperBound.toString(), gasValue: gasValue.toString(), collateralValue: collateralValue.toString() }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
