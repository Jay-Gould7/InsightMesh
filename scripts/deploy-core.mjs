import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import dotenv from "dotenv";
import hre from "hardhat";
import { Conflux } from "js-conflux-sdk";

dotenv.config();

function normalizePrivateKey(value) {
  if (!value) return value;
  return value.startsWith("0x") ? value : `0x${value}`;
}

async function loadArtifact(relativePath) {
  const absolutePath = resolve(process.cwd(), relativePath);
  return JSON.parse(await readFile(absolutePath, "utf8"));
}

async function main() {
  await hre.run("compile");

  const rpcUrl = process.env.CONFLUX_CORE_RPC_URL || "https://test.confluxrpc.com";
  const networkId = Number(process.env.CONFLUX_CORE_NETWORK_ID || "1");
  const privateKey = normalizePrivateKey(process.env.CONFLUX_CORE_RELAYER_PRIVATE_KEY);
  if (!privateKey) throw new Error("Missing CONFLUX_CORE_RELAYER_PRIVATE_KEY");

  const cfx = new Conflux({ url: rpcUrl, networkId });
  const account = cfx.wallet.addPrivateKey(privateKey);

  const bountyArtifact = await loadArtifact("artifacts/contracts/core/BountyRegistry.sol/BountyRegistry.json");
  const submissionArtifact = await loadArtifact("artifacts/contracts/core/SubmissionRegistry.sol/SubmissionRegistry.json");

  const bountyContract = cfx.Contract({ abi: bountyArtifact.abi, bytecode: bountyArtifact.bytecode });
  const bountyReceipt = await bountyContract.constructor().sendTransaction({ from: account.address }).executed();
  const bountyRegistryAddress = bountyReceipt.contractCreated;

  const submissionContract = cfx.Contract({ abi: submissionArtifact.abi, bytecode: submissionArtifact.bytecode });
  const submissionReceipt = await submissionContract.constructor(bountyRegistryAddress).sendTransaction({ from: account.address }).executed();
  const submissionRegistryAddress = submissionReceipt.contractCreated;

  const boundRegistry = cfx.Contract({ abi: bountyArtifact.abi, address: bountyRegistryAddress });
  await boundRegistry.setSubmissionRegistry(submissionRegistryAddress).sendTransaction({ from: account.address }).executed();

  console.log(JSON.stringify({ bountyRegistryAddress, submissionRegistryAddress, deployer: account.address }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
