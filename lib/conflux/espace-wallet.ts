"use client";

import type { EIP1193Provider } from "viem";

export type InjectedEvmProvider = EIP1193Provider & {
  providers?: InjectedEvmProvider[];
  providerInfo?: {
    name?: string;
    rdns?: string;
    uuid?: string;
  };
  name?: string;
  isMetaMask?: boolean;
  isRabby?: boolean;
  isCoinbaseWallet?: boolean;
  isTrust?: boolean;
  isTokenPocket?: boolean;
  isBitKeep?: boolean;
  isBitget?: boolean;
  isOKExWallet?: boolean;
  isOkxWallet?: boolean;
  isPhantom?: boolean;
  isBraveWallet?: boolean;
};

export type ESpaceWalletOption = {
  id: string;
  name: string;
  provider: InjectedEvmProvider;
};

const storageKey = "insightmesh.espace.wallet";

function getInjectedEthereum() {
  return (window as Window & { ethereum?: InjectedEvmProvider }).ethereum;
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "injected";
}

function getWalletName(provider: InjectedEvmProvider) {
  if (provider.providerInfo?.name) return provider.providerInfo.name;
  if (provider.isRabby) return "Rabby";
  if (provider.isMetaMask) return provider.isBraveWallet ? "Brave Wallet" : "MetaMask";
  if (provider.isCoinbaseWallet) return "Coinbase Wallet";
  if (provider.isTrust) return "Trust Wallet";
  if (provider.isTokenPocket) return "TokenPocket";
  if (provider.isBitKeep || provider.isBitget) return "Bitget Wallet";
  if (provider.isOKExWallet || provider.isOkxWallet) return "OKX Wallet";
  if (provider.isPhantom) return "Phantom";
  if (provider.name) return provider.name;
  return "Injected Wallet";
}

function getWalletId(provider: InjectedEvmProvider, fallbackIndex: number) {
  if (provider.providerInfo?.rdns) return slugify(provider.providerInfo.rdns);
  if (provider.providerInfo?.uuid) return slugify(provider.providerInfo.uuid);
  if (provider.isRabby) return "rabby";
  if (provider.isMetaMask && !provider.isBraveWallet) return "metamask";
  if (provider.isCoinbaseWallet) return "coinbase";
  if (provider.isTrust) return "trust";
  if (provider.isTokenPocket) return "tokenpocket";
  if (provider.isBitKeep || provider.isBitget) return "bitget";
  if (provider.isOKExWallet || provider.isOkxWallet) return "okx";
  if (provider.isPhantom) return "phantom";
  if (provider.name) return slugify(provider.name);
  return `injected-${fallbackIndex}`;
}

export function getAvailableESpaceWallets() {
  const ethereum = getInjectedEthereum();
  if (!ethereum) return [] as ESpaceWalletOption[];

  const rawProviders =
    Array.isArray(ethereum.providers) && ethereum.providers.length > 0
      ? ethereum.providers
      : [ethereum];

  const uniqueWallets = new Map<string, ESpaceWalletOption>();

  rawProviders.forEach((provider, index) => {
    const id = getWalletId(provider, index);
    if (!uniqueWallets.has(id)) {
      uniqueWallets.set(id, {
        id,
        name: getWalletName(provider),
        provider,
      });
    }
  });

  return Array.from(uniqueWallets.values());
}

export function getStoredESpaceWalletId() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(storageKey) ?? "";
}

export function setStoredESpaceWalletId(walletId: string) {
  if (typeof window === "undefined") return;
  if (walletId) {
    window.localStorage.setItem(storageKey, walletId);
    return;
  }

  window.localStorage.removeItem(storageKey);
}

export function getSelectedESpaceWallet(preferredWalletId?: string) {
  const wallets = getAvailableESpaceWallets();
  const storedWalletId = preferredWalletId || getStoredESpaceWalletId();

  const selectedWallet =
    wallets.find((wallet) => wallet.id === storedWalletId) ??
    wallets[0] ??
    null;

  return {
    wallets,
    selectedWallet,
  };
}

