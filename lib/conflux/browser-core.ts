"use client";

import { Interface, parseUnits } from "ethers";

import { bountyRegistryAbi, submissionRegistryAbi } from "@/lib/conflux/abis";
import { bigintToRpcHex, callCoreRpc, rpcValueToBigInt, type RawCoreEstimate, type RawCoreStatus } from "@/lib/conflux/core-rpc";
import type { CoreSpaceConfig } from "@/lib/types";

type ConfluxProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

type BrowserCoreInput = {
  rpcUrl: string;
  from: string;
  to: string;
  data: string;
  expectedNetworkId: number;
};

const bountyInterface = new Interface(bountyRegistryAbi);
const submissionInterface = new Interface(submissionRegistryAbi);

function getConfluxProvider() {
  const provider = (window as Window & { conflux?: ConfluxProvider }).conflux;
  if (!provider?.request) {
    throw new Error("No Fluent wallet was found in the browser.");
  }

  return provider;
}

function normalizeHash(value: unknown) {
  if (typeof value !== "string" || !value.startsWith("0x")) {
    throw new Error("Core wallet did not return a valid transaction hash.");
  }

  return value;
}

async function requestCoreStatus(provider: ConfluxProvider) {
  return provider.request({ method: "cfx_getStatus" }) as Promise<RawCoreStatus>;
}

async function ensureCoreNetwork(provider: ConfluxProvider, expectedNetworkId: number) {
  let status: RawCoreStatus;

  try {
    status = await requestCoreStatus(provider);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("Method cfx_getStatus not supported by network")) {
      throw new Error("Fluent is currently on eSpace. Switch Fluent back to Conflux Core testnet before sending this transaction.");
    }

    throw new Error("Unable to read the current Fluent network. Switch Fluent to Conflux Core testnet and try again.");
  }

  const networkId = Number(rpcValueToBigInt(status.networkId ?? status.chainId));

  if (networkId !== expectedNetworkId) {
    throw new Error("Switch Fluent to Conflux Core testnet before sending the transaction.");
  }
}

async function requestCoreAccounts(provider: ConfluxProvider) {
  const accounts = await provider.request({ method: "cfx_requestAccounts" }) as string[];
  if (!accounts?.[0]) {
    throw new Error("No Core wallet account is connected.");
  }

  return accounts;
}

async function buildCoreTransaction(input: BrowserCoreInput) {
  const [status, gasPrice, nonce, epochHeight] = await Promise.all([
    callCoreRpc<RawCoreStatus>(input.rpcUrl, "cfx_getStatus"),
    callCoreRpc<string>(input.rpcUrl, "cfx_gasPrice"),
    callCoreRpc<string>(input.rpcUrl, "cfx_getNextNonce", [input.from]),
    callCoreRpc<string>(input.rpcUrl, "cfx_epochNumber"),
  ]);

  const estimate = await callCoreRpc<RawCoreEstimate>(input.rpcUrl, "cfx_estimateGasAndCollateral", [{
    from: input.from,
    to: input.to,
    data: input.data,
  }]);

  const networkId = Number(rpcValueToBigInt(status.networkId ?? status.chainId));
  if (networkId !== input.expectedNetworkId) {
    throw new Error("The configured Core RPC endpoint does not match the expected Conflux network.");
  }

  return {
    from: input.from,
    to: input.to,
    data: input.data,
    value: "0x0",
    gas: typeof estimate.gasLimit === "string" ? estimate.gasLimit : bigintToRpcHex(rpcValueToBigInt(estimate.gasLimit)),
    storageLimit:
      typeof estimate.storageCollateralized === "string"
        ? estimate.storageCollateralized
        : bigintToRpcHex(rpcValueToBigInt(estimate.storageCollateralized)),
    gasPrice,
    nonce,
    epochHeight,
    chainId: bigintToRpcHex(rpcValueToBigInt(status.chainId)),
  };
}

async function sendCoreTransaction(input: BrowserCoreInput) {
  const provider = getConfluxProvider();
  await ensureCoreNetwork(provider, input.expectedNetworkId);
  const accounts = await requestCoreAccounts(provider);
  if (accounts[0].toLowerCase() !== input.from.toLowerCase()) {
    throw new Error("The connected Fluent account does not match the Core address in the form.");
  }

  const tx = await buildCoreTransaction(input);
  const hash = await provider.request({
    method: "cfx_sendTransaction",
    params: [tx],
  });

  const txHash = normalizeHash(hash);
  await callCoreRpc(input.rpcUrl, "cfx_getTransactionByHash", [txHash]);
  return txHash;
}

export async function createBountyOnCore(input: {
  chainBountyId: number;
  creatorCoreAddress: string;
  title: string;
  metadataHash: string;
  rewardAmount: string;
  deadline: Date;
  core: CoreSpaceConfig;
}) {
  const data = bountyInterface.encodeFunctionData("createBounty", [
    input.title,
    input.metadataHash,
    parseUnits(input.rewardAmount, input.core.rewardDecimals),
    BigInt(Math.floor(input.deadline.getTime() / 1000)),
  ]);

  return {
    coreCreateTxHash: await sendCoreTransaction({
      rpcUrl: input.core.rpcUrl,
      from: input.creatorCoreAddress,
      to: input.core.bountyRegistryAddress,
      data,
      expectedNetworkId: input.core.networkId,
    }),
  };
}

export async function submitFeedbackOnCore(input: {
  chainBountyId: number;
  submitterCoreAddress: string;
  payoutAddress: string;
  contentHash: string;
  core: CoreSpaceConfig;
}) {
  const data = submissionInterface.encodeFunctionData("submit", [
    BigInt(input.chainBountyId),
    input.contentHash,
    input.payoutAddress,
  ]);

  return {
    coreTxHash: await sendCoreTransaction({
      rpcUrl: input.core.rpcUrl,
      from: input.submitterCoreAddress,
      to: input.core.submissionRegistryAddress,
      data,
      expectedNetworkId: input.core.networkId,
    }),
  };
}

export async function supportSubmissionOnCore(input: {
  chainBountyId: number;
  chainSubmissionId: number;
  supporterCoreAddress: string;
  core: CoreSpaceConfig;
}) {
  const data = submissionInterface.encodeFunctionData("support", [
    BigInt(input.chainBountyId),
    BigInt(input.chainSubmissionId),
  ]);

  return {
    coreTxHash: await sendCoreTransaction({
      rpcUrl: input.core.rpcUrl,
      from: input.supporterCoreAddress,
      to: input.core.submissionRegistryAddress,
      data,
      expectedNetworkId: input.core.networkId,
    }),
  };
}
