"use client";

import type { Address, EIP1193Provider, Hash } from "viem";
import { createPublicClient, createWalletClient, custom, parseUnits } from "viem";

import { erc20Abi, rewardVaultAbi } from "@/lib/conflux/abis";
import { getSelectedESpaceWallet } from "@/lib/conflux/espace-wallet";
import type { BountyFundingConfig } from "@/lib/types";

type BrowserFundingInput = {
  bountyId: number;
  creatorEspaceAddress: string;
  rewardAmount: string;
  funding: BountyFundingConfig;
};

function getEthereumProvider() {
  const provider = getSelectedESpaceWallet().selectedWallet?.provider as EIP1193Provider | undefined;
  if (!provider) {
    throw new Error("No eSpace wallet was found in the browser.");
  }
  return provider;
}

function createChainConfig(chainId: number, rpcUrl: string) {
  return {
    id: chainId,
    name: "Conflux eSpace Testnet",
    nativeCurrency: {
      name: "CFX",
      symbol: "CFX",
      decimals: 18,
    },
    rpcUrls: {
      default: {
        http: [rpcUrl],
      },
    },
    blockExplorers: {
      default: {
        name: "ConfluxScan",
        url: "https://evmtestnet.confluxscan.org",
      },
    },
    testnet: true,
  } as const;
}

async function ensureESpaceChain(provider: EIP1193Provider, chainId: number, rpcUrl: string) {
  const targetChainId = `0x${chainId.toString(16)}`;
  const currentChainId = await provider.request({ method: "eth_chainId" });

  if (currentChainId === targetChainId) {
    return;
  }

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: targetChainId }],
    });
  } catch {
    await provider.request({
      method: "wallet_addEthereumChain",
      params: [{
        chainId: targetChainId,
        chainName: "Conflux eSpace Testnet",
        nativeCurrency: {
          name: "CFX",
          symbol: "CFX",
          decimals: 18,
        },
        rpcUrls: [rpcUrl],
        blockExplorerUrls: ["https://evmtestnet.confluxscan.org"],
      }],
    });
  }
}

export async function approveAndDepositRewardPool(input: BrowserFundingInput) {
  const provider = getEthereumProvider();
  await ensureESpaceChain(provider, input.funding.chainId, input.funding.rpcUrl);

  const accounts = await provider.request({ method: "eth_requestAccounts" }) as string[];
  const account = accounts[0] as Address | undefined;
  if (!account) {
    throw new Error("No eSpace wallet account is connected.");
  }

  if (account.toLowerCase() !== input.creatorEspaceAddress.toLowerCase()) {
    throw new Error("The connected eSpace wallet does not match the creator payout address.");
  }

  const chain = createChainConfig(input.funding.chainId, input.funding.rpcUrl);
  const walletClient = createWalletClient({
    account,
    chain,
    transport: custom(provider),
  });
  const publicClient = createPublicClient({
    chain,
    transport: custom(provider),
  });
  const amount = parseUnits(input.rewardAmount, input.funding.decimals);

  const approveTxHash = await walletClient.writeContract({
    account,
    address: input.funding.usdt0Address as Address,
    abi: erc20Abi,
    functionName: "approve",
    args: [input.funding.rewardVaultAddress as Address, amount],
  });
  await publicClient.waitForTransactionReceipt({ hash: approveTxHash });

  const depositTxHash = await walletClient.writeContract({
    account,
    address: input.funding.rewardVaultAddress as Address,
    abi: rewardVaultAbi,
    functionName: "deposit",
    args: [BigInt(input.bountyId), amount],
  });
  await publicClient.waitForTransactionReceipt({ hash: depositTxHash });

  return {
    approveTxHash: approveTxHash as Hash,
    depositTxHash: depositTxHash as Hash,
  };
}
