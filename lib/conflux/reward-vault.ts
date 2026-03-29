import type { Address, Hash } from "viem";
import { decodeFunctionData, parseUnits } from "viem";

import { fakeTxHash } from "@/lib/demo";
import { env, hasESpaceAccess, hasRewardVaultConfig } from "@/lib/env";
import { rewardVaultAbi } from "@/lib/conflux/abis";
import { getESpaceClients, getESpacePublicClient } from "@/lib/conflux/espace-client";

export async function verifyRewardDeposit(input: {
  bountyId: number;
  rewardAmount: string;
  creatorEspaceAddress: string;
  depositTxHash: string;
}) {
  if (env.demoMode) {
    return { vaultDepositTx: input.depositTxHash || fakeTxHash() };
  }

  if (!hasRewardVaultConfig()) {
    throw new Error("Reward vault is not configured.");
  }

  const publicClient = getESpacePublicClient();
  const hash = input.depositTxHash as Hash;
  const [receipt, transaction] = await Promise.all([
    publicClient.getTransactionReceipt({ hash }),
    publicClient.getTransaction({ hash }),
  ]);

  if (receipt.status !== "success") {
    throw new Error("Deposit transaction failed.");
  }

  if (!transaction.to || transaction.to.toLowerCase() !== env.eSpaceRewardVaultAddress.toLowerCase()) {
    throw new Error("Deposit transaction targeted the wrong vault.");
  }

  if (transaction.from.toLowerCase() !== input.creatorEspaceAddress.toLowerCase()) {
    throw new Error("Deposit transaction signer does not match the creator eSpace address.");
  }

  const decoded = decodeFunctionData({
    abi: rewardVaultAbi,
    data: transaction.input,
  });

  if (decoded.functionName !== "deposit") {
    throw new Error("Transaction is not a reward pool deposit.");
  }

  const [bountyId, amount] = decoded.args;
  if (bountyId !== BigInt(input.bountyId)) {
    throw new Error("Deposit transaction bounty id mismatch.");
  }

  const expectedAmount = parseUnits(input.rewardAmount, 6);
  if (amount !== expectedAmount) {
    throw new Error("Deposit transaction amount mismatch.");
  }

  return { vaultDepositTx: input.depositTxHash };
}

export async function distributeRewards(
  bountyId: number,
  recipients: string[],
  rewardAmounts: string[],
) {
  if (env.demoMode || !hasESpaceAccess()) {
    return { settlementTx: fakeTxHash() };
  }

  const { walletClient, publicClient } = getESpaceClients();
  const hash = await walletClient.writeContract({
    address: env.eSpaceRewardVaultAddress as Address,
    abi: rewardVaultAbi,
    functionName: "distribute",
    args: [
      BigInt(bountyId),
      recipients as Address[],
      rewardAmounts.map((amount) => parseUnits(amount, 6)),
    ],
  });
  await publicClient.waitForTransactionReceipt({ hash });
  return { settlementTx: hash };
}
