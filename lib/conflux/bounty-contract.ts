import { Interface, parseUnits } from "ethers";

import { fakeTxHash } from "@/lib/demo";
import { bountyRegistryAbi } from "@/lib/conflux/abis";
import { callCoreRpc, rpcValueToBigInt, rpcValueToNumber, waitForCoreReceipt, type RawCoreReceipt, type RawCoreTransaction } from "@/lib/conflux/core-rpc";
import { env, hasCoreContractConfig } from "@/lib/env";

const bountyInterface = new Interface(bountyRegistryAbi);

function findBountyCreatedLog(receipt: RawCoreReceipt) {
  for (const log of receipt.logs ?? []) {
    try {
      const parsed = bountyInterface.parseLog({ data: log.data, topics: log.topics });
      if (parsed?.name === "BountyCreated") {
        return parsed;
      }
    } catch {
      continue;
    }
  }

  return null;
}

export async function verifyCoreBountyCreation(input: {
  draftBountyId: number;
  title: string;
  metadataHash: string;
  rewardAmount: string;
  deadline: Date;
  creatorCoreAddress: string;
  coreCreateTxHash: string;
}) {
  if (env.demoMode) {
    return {
      chainBountyId: input.draftBountyId,
      coreCreateTx: input.coreCreateTxHash || fakeTxHash(),
    };
  }

  if (!hasCoreContractConfig()) {
    throw new Error("Core contracts are not configured.");
  }

  const [transaction, receipt] = await Promise.all([
    callCoreRpc<RawCoreTransaction | null>(env.coreRpcUrl, "cfx_getTransactionByHash", [input.coreCreateTxHash]),
    waitForCoreReceipt(env.coreRpcUrl, input.coreCreateTxHash),
  ]);

  if (!transaction) {
    throw new Error("Core create transaction was not found.");
  }

  if (rpcValueToNumber(receipt.outcomeStatus) !== 0) {
    throw new Error("Core create transaction failed.");
  }

  if (!transaction.to || transaction.to.toLowerCase() !== env.coreRegistryAddress.toLowerCase()) {
    throw new Error("Core create transaction targeted the wrong registry.");
  }

  if (transaction.from.toLowerCase() !== input.creatorCoreAddress.toLowerCase()) {
    throw new Error("Core create transaction signer does not match the creator address.");
  }

  const decoded = bountyInterface.decodeFunctionData("createBounty", transaction.data);
  const [title, metadataHash, rewardAmount, deadline] = decoded;

  if (title !== input.title) {
    throw new Error("Core create transaction title mismatch.");
  }

  if (metadataHash !== input.metadataHash) {
    throw new Error("Core create transaction metadata hash mismatch.");
  }

  if (rewardAmount !== parseUnits(input.rewardAmount, 6)) {
    throw new Error("Core create transaction reward amount mismatch.");
  }

  if (deadline !== BigInt(Math.floor(input.deadline.getTime() / 1000))) {
    throw new Error("Core create transaction deadline mismatch.");
  }

  const created = findBountyCreatedLog(receipt);
  if (!created) {
    throw new Error("BountyCreated event not found in the Core transaction receipt.");
  }

  return {
    chainBountyId: Number(created.args.bountyId),
    coreCreateTx: input.coreCreateTxHash,
  };
}
