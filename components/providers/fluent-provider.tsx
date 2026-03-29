"use client";

import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type FluentContextValue = {
  address: string;
  connect: () => Promise<void>;
  disconnect: () => void;
  refresh: () => Promise<void>;
};

const FluentContext = createContext<FluentContextValue | null>(null);

type FluentProviderApi = {
  request?: (args: { method: string }) => Promise<unknown>;
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, listener: (...args: unknown[]) => void) => void;
};

export function FluentProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState("");

  async function syncAddress(method: "cfx_accounts" | "cfx_requestAccounts") {
    const provider = (window as Window & { conflux?: FluentProviderApi }).conflux;

    if (!provider?.request) {
      startTransition(() => setAddress(""));
      if (method === "cfx_requestAccounts") {
        throw new Error("No Fluent wallet was found in the browser.");
      }
      return;
    }

    try {
      const accounts = await provider.request({ method }) as string[] | undefined;
      startTransition(() => setAddress(accounts?.[0] ?? ""));
    } catch (error) {
      if (method === "cfx_requestAccounts") {
        throw error;
      }

      startTransition(() => setAddress(""));
    }
  }

  useEffect(() => {
    const provider = (window as Window & { conflux?: FluentProviderApi }).conflux;
    const handleAccountsChanged = (...args: unknown[]) => {
      const accounts = Array.isArray(args[0]) ? args[0] as string[] : [];
      startTransition(() => setAddress(accounts?.[0] ?? ""));
    };
    const handleDisconnect = () => {
      startTransition(() => setAddress(""));
    };

    void syncAddress("cfx_accounts");
    provider?.on?.("accountsChanged", handleAccountsChanged);
    provider?.on?.("disconnect", handleDisconnect);

    return () => {
      provider?.removeListener?.("accountsChanged", handleAccountsChanged);
      provider?.removeListener?.("disconnect", handleDisconnect);
    };
  }, []);

  const connect = async () => {
    await syncAddress("cfx_requestAccounts");
  };

  const disconnect = () => {
    startTransition(() => setAddress(""));
  };

  const refresh = async () => {
    await syncAddress("cfx_accounts");
  };

  const value = { address, connect, disconnect, refresh };
  return <FluentContext.Provider value={value}>{children}</FluentContext.Provider>;
}

export function useFluentWallet() {
  const context = useContext(FluentContext);
  if (!context) throw new Error("useFluentWallet must be used inside FluentProvider");
  return context;
}
