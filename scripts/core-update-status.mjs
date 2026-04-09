import dotenv from "dotenv";
import { Conflux } from "js-conflux-sdk";

dotenv.config();

function normalizePrivateKey(value) {
  if (!value) return value;
  return value.startsWith("0x") ? value : `0x${value}`;
}

function parseArgs(argv) {
  const result = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) {
      continue;
    }

    result[arg.slice(2)] = argv[index + 1];
    index += 1;
  }

  return result;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const bountyId = Number(args.bountyId);
  const status = Number(args.status);

  if (!Number.isInteger(bountyId) || bountyId < 0) {
    throw new Error("Missing or invalid --bountyId");
  }

  if (!Number.isInteger(status) || status < 0) {
    throw new Error("Missing or invalid --status");
  }

  const rpcUrl = process.env.CONFLUX_CORE_RPC_URL || "https://test.confluxrpc.com";
  const networkId = Number(process.env.CONFLUX_CORE_NETWORK_ID || "1");
  const registryAddress = process.env.CONFLUX_CORE_REGISTRY_ADDRESS;
  const privateKey = normalizePrivateKey(process.env.CONFLUX_CORE_RELAYER_PRIVATE_KEY);

  if (!registryAddress || !privateKey) {
    throw new Error("Missing CONFLUX_CORE_REGISTRY_ADDRESS or CONFLUX_CORE_RELAYER_PRIVATE_KEY");
  }

  const cfx = new Conflux({ url: rpcUrl, networkId });
  const account = cfx.wallet.addPrivateKey(privateKey);
  const contract = cfx.Contract({
    abi: [
      {
        type: "function",
        name: "updateStatus",
        stateMutability: "nonpayable",
        inputs: [
          { name: "bountyId", type: "uint256" },
          { name: "status", type: "uint8" },
        ],
        outputs: [],
      },
    ],
    address: registryAddress,
  });

  const receipt = await contract
    .updateStatus(BigInt(bountyId), status)
    .sendTransaction({ from: account.address })
    .executed();

  console.log(JSON.stringify({ coreTxHash: receipt.transactionHash }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
