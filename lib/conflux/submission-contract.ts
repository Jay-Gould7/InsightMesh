import { Interface } from "ethers";

import { coreAddressesEqual } from "@/lib/conflux/address";
import { fakeTxHash } from "@/lib/demo";
import { submissionRegistryAbi } from "@/lib/conflux/abis";
import { callCoreRpc, rpcValueToNumber, waitForCoreReceipt, type RawCoreReceipt, type RawCoreTransaction } from "@/lib/conflux/core-rpc";
import { env, hasCoreContractConfig } from "@/lib/env";

const submissionInterface = new Interface(submissionRegistryAbi);

function findSubmissionRecordedLog(receipt: RawCoreReceipt) {
  for (const log of receipt.logs ?? []) {
    try {
      const parsed = submissionInterface.parseLog({ data: log.data, topics: log.topics });
      if (parsed?.name === "SubmissionRecorded") {
        return parsed;
      }
    } catch {
      continue;
    }
  }

  return null;
}

export async function verifyCoreSubmission(input: {
  chainBountyId: number;
  contentHash: string;
  payoutAddress: string;
  submitterCoreAddress: string;
  coreTxHash: string;
}) {
  if (env.demoMode) {
    return {
      coreSubmissionId: 0,
      coreTxHash: input.coreTxHash || fakeTxHash(),
    };
  }

  if (!hasCoreContractConfig()) {
    throw new Error("Core contracts are not configured.");
  }

  const [transaction, receipt] = await Promise.all([
    callCoreRpc<RawCoreTransaction | null>(env.coreRpcUrl, "cfx_getTransactionByHash", [input.coreTxHash]),
    waitForCoreReceipt(env.coreRpcUrl, input.coreTxHash),
  ]);

  if (!transaction) {
    throw new Error("Core submit transaction was not found.");
  }

  if (rpcValueToNumber(receipt.outcomeStatus) !== 0) {
    throw new Error("Core submit transaction failed.");
  }

  if (!transaction.to || !coreAddressesEqual(transaction.to, env.coreSubmissionAddress)) {
    throw new Error("Core submit transaction targeted the wrong registry.");
  }

  if (!coreAddressesEqual(transaction.from, input.submitterCoreAddress)) {
    throw new Error("Core submit transaction signer does not match the submitter address.");
  }

  const decoded = submissionInterface.decodeFunctionData("submit", transaction.data);
  const [bountyId, contentHash, payoutAddress] = decoded;

  if (bountyId !== BigInt(input.chainBountyId)) {
    throw new Error("Core submit transaction bounty id mismatch.");
  }

  if (String(contentHash).toLowerCase() !== input.contentHash.toLowerCase()) {
    throw new Error("Core submit transaction content hash mismatch.");
  }

  if (String(payoutAddress).toLowerCase() !== input.payoutAddress.toLowerCase()) {
    throw new Error("Core submit transaction payout address mismatch.");
  }

  const recorded = findSubmissionRecordedLog(receipt);
  if (!recorded) {
    throw new Error("SubmissionRecorded event not found in the Core transaction receipt.");
  }

  return {
    coreSubmissionId: Number(recorded.args.submissionId),
    coreTxHash: input.coreTxHash,
  };
}

export async function verifyCoreSupport(input: {
  chainBountyId: number;
  chainSubmissionId: number;
  supporterCoreAddress: string;
  coreTxHash: string;
}) {
  if (env.demoMode) {
    return {
      coreTxHash: input.coreTxHash || fakeTxHash(),
    };
  }

  if (!hasCoreContractConfig()) {
    throw new Error("Core contracts are not configured.");
  }

  const [transaction, receipt] = await Promise.all([
    callCoreRpc<RawCoreTransaction | null>(env.coreRpcUrl, "cfx_getTransactionByHash", [input.coreTxHash]),
    waitForCoreReceipt(env.coreRpcUrl, input.coreTxHash),
  ]);

  if (!transaction) {
    throw new Error("Core support transaction was not found.");
  }

  if (rpcValueToNumber(receipt.outcomeStatus) !== 0) {
    throw new Error("Core support transaction failed.");
  }

  if (!transaction.to || !coreAddressesEqual(transaction.to, env.coreSubmissionAddress)) {
    throw new Error("Core support transaction targeted the wrong registry.");
  }

  if (!coreAddressesEqual(transaction.from, input.supporterCoreAddress)) {
    throw new Error("Core support transaction signer does not match the supporter address.");
  }

  const decoded = submissionInterface.decodeFunctionData("support", transaction.data);
  const [bountyId, submissionId] = decoded;

  if (bountyId !== BigInt(input.chainBountyId)) {
    throw new Error("Core support transaction bounty id mismatch.");
  }

  if (submissionId !== BigInt(input.chainSubmissionId)) {
    throw new Error("Core support transaction submission id mismatch.");
  }

  return {
    coreTxHash: input.coreTxHash,
  };
}
