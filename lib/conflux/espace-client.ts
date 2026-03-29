import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

import { env } from "@/lib/env";

export const eSpaceChain = {
  id: env.eSpaceChainId,
  name: "Conflux eSpace Testnet",
  nativeCurrency: {
    name: "CFX",
    symbol: "CFX",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [env.eSpaceRpcUrl],
    },
  },
  testnet: true,
} as const;

export function getESpacePublicClient() {
  return createPublicClient({ chain: eSpaceChain, transport: http(env.eSpaceRpcUrl) });
}

export function getESpaceWalletClient() {
  const account = privateKeyToAccount(env.eSpaceRelayerPrivateKey as `0x${string}`);
  return createWalletClient({ account, chain: eSpaceChain, transport: http(env.eSpaceRpcUrl) });
}

export function getESpaceClients() {
  return {
    publicClient: getESpacePublicClient(),
    walletClient: getESpaceWalletClient(),
  };
}
