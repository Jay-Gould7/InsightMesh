"use client";

import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  getAvailableESpaceWallets,
  getSelectedESpaceWallet,
  setStoredESpaceWalletId,
  type ESpaceWalletOption,
  type InjectedEvmProvider,
} from "@/lib/conflux/espace-wallet";

type ESpaceContextValue = {
  address: string;
  walletId: string;
  walletName: string;
  wallets: Array<Pick<ESpaceWalletOption, "id" | "name">>;
  connect: () => Promise<void>;
  disconnect: () => void;
  refresh: () => Promise<void>;
  selectWallet: (walletId: string) => Promise<void>;
};

const ESpaceContext = createContext<ESpaceContextValue | null>(null);

export function ESpaceProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState("");
  const [walletId, setWalletId] = useState("");
  const [wallets, setWallets] = useState<Array<Pick<ESpaceWalletOption, "id" | "name">>>([]);

  function syncWalletInventory(preferredWalletId?: string) {
    const detectedWallets = getAvailableESpaceWallets();
    const nextWallets = detectedWallets.map(({ id, name }) => ({ id, name }));
    const selectedWallet =
      detectedWallets.find((wallet) => wallet.id === preferredWalletId) ??
      detectedWallets.find((wallet) => wallet.id === walletId) ??
      detectedWallets[0] ??
      null;

    startTransition(() => {
      setWallets(nextWallets);
      setWalletId(selectedWallet?.id ?? "");
    });

    if (selectedWallet?.id) {
      setStoredESpaceWalletId(selectedWallet.id);
    }

    return selectedWallet;
  }

  async function syncAddress(method: "eth_accounts" | "eth_requestAccounts", provider?: InjectedEvmProvider | null) {
    const activeProvider = provider ?? getSelectedESpaceWallet(walletId).selectedWallet?.provider ?? null;

    if (!activeProvider?.request) {
      startTransition(() => setAddress(""));
      if (method === "eth_requestAccounts") {
        throw new Error("No eSpace wallet was found in the browser.");
      }
      return;
    }

    try {
      const accounts = await activeProvider.request({ method }) as string[] | undefined;
      startTransition(() => setAddress(accounts?.[0] ?? ""));
    } catch (error) {
      if (method === "eth_requestAccounts") {
        throw error;
      }

      startTransition(() => setAddress(""));
    }
  }

  useEffect(() => {
    const initialSelection = getSelectedESpaceWallet();
    const initialWallets = initialSelection.wallets.map(({ id, name }) => ({ id, name }));

    startTransition(() => {
      setWallets(initialWallets);
      setWalletId(initialSelection.selectedWallet?.id ?? "");
    });

    if (initialSelection.selectedWallet?.id) {
      setStoredESpaceWalletId(initialSelection.selectedWallet.id);
      void syncAddress("eth_accounts", initialSelection.selectedWallet.provider);
    }
  }, []);

  useEffect(() => {
    const provider = getSelectedESpaceWallet(walletId).selectedWallet?.provider;
    if (!provider) {
      startTransition(() => setAddress(""));
      return;
    }

    const handleAccountsChanged = (...args: unknown[]) => {
      const accounts = Array.isArray(args[0]) ? args[0] as string[] : [];
      startTransition(() => setAddress(accounts?.[0] ?? ""));
    };
    const handleDisconnect = () => {
      startTransition(() => setAddress(""));
    };

    void syncAddress("eth_accounts", provider);
    provider?.on?.("accountsChanged", handleAccountsChanged);
    provider?.on?.("disconnect", handleDisconnect);

    return () => {
      provider?.removeListener?.("accountsChanged", handleAccountsChanged);
      provider?.removeListener?.("disconnect", handleDisconnect);
    };
  }, [walletId]);

  const connect = async () => {
    const selectedWallet = syncWalletInventory();
    await syncAddress("eth_requestAccounts", selectedWallet?.provider);
  };

  const disconnect = () => {
    startTransition(() => setAddress(""));
  };

  const refresh = async () => {
    const selectedWallet = syncWalletInventory();
    await syncAddress("eth_accounts", selectedWallet?.provider);
  };

  const selectWallet = async (nextWalletId: string) => {
    const selectedWallet = syncWalletInventory(nextWalletId);
    await syncAddress("eth_accounts", selectedWallet?.provider);
  };

  const walletName = useMemo(
    () => wallets.find((wallet) => wallet.id === walletId)?.name ?? (wallets[0]?.name ?? "Injected Wallet"),
    [walletId, wallets],
  );

  const value = { address, walletId, walletName, wallets, connect, disconnect, refresh, selectWallet };
  return <ESpaceContext.Provider value={value}>{children}</ESpaceContext.Provider>;
}

export function useESpaceWallet() {
  const context = useContext(ESpaceContext);
  if (!context) throw new Error("useESpaceWallet must be used inside ESpaceProvider");
  return context;
}
