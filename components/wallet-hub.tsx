"use client";

import { Copy, LogOut, RefreshCw, Wallet } from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import StarBorder from "@/components/reactbits/StarBorder";
import BorderGlow from "@/components/reactbits/BorderGlow";

import { useESpaceWallet } from "@/components/providers/espace-provider";
import { useFluentWallet } from "@/components/providers/fluent-provider";
import { getSelectedESpaceWallet } from "@/lib/conflux/espace-wallet";
import { truncateAddress } from "@/lib/utils";

type WalletHubProps = {
  coreNetworkId: number;
  eSpaceChainId: number;
};

type WalletNetworkState = {
  tone: "neutral" | "good" | "warning";
  label: string;
};

type WalletPanelProps = {
  label: string;
  accent: string;
  address: string;
  network: WalletNetworkState;
  helper: string;
  emphasis?: "primary" | "secondary";
  walletName?: string;
  walletId?: string;
  walletOptions?: Array<{ id: string; name: string }>;
  selectWallet?: (walletId: string) => Promise<void>;
  connect: () => Promise<void>;
  disconnect: () => void;
};

function parseRpcNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string") {
    return value.startsWith("0x") ? Number.parseInt(value, 16) : Number(value);
  }
  return Number.NaN;
}

function toneClasses(tone: WalletNetworkState["tone"]) {
  if (tone === "good") return "border-emerald-400/30 bg-emerald-400/10 text-emerald-400";
  if (tone === "warning") return "border-amber-400/30 bg-amber-400/10 text-amber-500";
  return "border-white/10 bg-white/5 text-zinc-400";
}

function WalletPanel({
  label,
  accent,
  address,
  network,
  helper,
  emphasis = "primary",
  walletName,
  walletId,
  walletOptions,
  selectWallet,
  connect,
  disconnect,
}: WalletPanelProps) {
  const [error, setError] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleConnect() {
    setError("");
    setIsBusy(true);
    try {
      await connect();
    } catch (connectError) {
      setError(connectError instanceof Error ? connectError.message : `Unable to connect ${label}.`);
    } finally {
      setIsBusy(false);
    }
  }

  async function handleCopy() {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  async function handleWalletSelect(nextWalletId: string) {
    if (!selectWallet) return;
    setError("");
    setIsBusy(true);
    try {
      await selectWallet(nextWalletId);
    } catch (selectError) {
      setError(selectError instanceof Error ? selectError.message : `Unable to switch ${label} wallet.`);
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 py-3 border-b border-white/10 last:border-0 last:pb-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${accent} ${address ? 'shadow-[0_0_8px] shadow-current' : ''}`} />
          <span className="text-white text-sm font-medium">{label === "Core" ? "Conflux Core" : "Conflux eSpace"}</span>
        </div>
        <span className={`text-[10px] uppercase border rounded-full px-2 py-0.5 font-medium tracking-wide ${toneClasses(network.tone)}`}>
          {network.label}
        </span>
      </div>

      {address ? (
        <div className="flex items-center justify-between bg-white/5 rounded-xl px-3 py-2 border border-white/5">
          <span className="font-mono text-sm text-zinc-300">
            {truncateAddress(address, 5)}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={handleCopy}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Copy Address"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={disconnect}
              className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-white/10 rounded-lg transition-colors"
              title="Disconnect"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={handleConnect}
          disabled={isBusy}
          className="self-start text-xs font-medium bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-full px-4 py-1.5 transition-colors disabled:opacity-50"
        >
          {isBusy ? "Connecting..." : `Connect`}
        </button>
      )}

      {walletOptions?.length ? (
        <div className="mt-1">
          <select
            value={walletId}
            onChange={(event) => void handleWalletSelect(event.target.value)}
            disabled={isBusy}
            className="w-full text-xs bg-black/40 border border-white/10 rounded-lg px-2 py-2 text-zinc-300 outline-none hover:border-white/20 transition-colors cursor-pointer appearance-none"
          >
            {walletOptions.map((wallet) => (
              <option key={wallet.id} value={wallet.id} className="bg-[#0A0A0A]">
                {wallet.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {error ? <p className="text-xs text-rose-400">{error}</p> : null}
    </div>
  );
}

export function WalletHub({ coreNetworkId, eSpaceChainId }: WalletHubProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isESpaceExpanded, setIsESpaceExpanded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const [coreChainHint, setCoreChainHint] = useState<number | null>(null);
  const [coreNetwork, setCoreNetwork] = useState<WalletNetworkState>({ tone: "neutral", label: "Idle" });
  const [eSpaceNetwork, setESpaceNetwork] = useState<WalletNetworkState>({ tone: "neutral", label: "Idle" });

  const {
    address: coreAddress,
    connect: connectCore,
    disconnect: disconnectCore,
    refresh: refreshCore,
  } = useFluentWallet();
  const {
    address: eSpaceAddress,
    walletId: eSpaceWalletId,
    walletName: eSpaceWalletName,
    wallets: eSpaceWallets,
    connect: connectESpace,
    disconnect: disconnectESpace,
    refresh: refreshESpace,
    selectWallet: selectESpaceWallet,
  } = useESpaceWallet();

  const connectedCount = [coreAddress, eSpaceAddress].filter(Boolean).length;
  const primaryAddress = coreAddress || eSpaceAddress;
  const isConnected = !!primaryAddress;

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) {
        return;
      }

      if (!rootRef.current?.contains(target)) {
        setIsOpen(false);
      }
    }

    if (!isOpen) return;
    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

  useEffect(() => {
    function handleCoreChainChange(chainId?: unknown) {
      const parsedChainId = parseRpcNumber(chainId);
      setCoreChainHint(Number.isNaN(parsedChainId) ? null : parsedChainId);
      setRefreshTick((current) => current + 1);
    }

    const confluxProvider = (window as Window & {
      conflux?: {
        on?: (event: string, listener: (chainId?: unknown) => void) => void;
        removeListener?: (event: string, listener: (chainId?: unknown) => void) => void;
      };
    }).conflux;

    confluxProvider?.on?.("chainChanged", handleCoreChainChange);
    return () => {
      confluxProvider?.removeListener?.("chainChanged", handleCoreChainChange);
    };
  }, []);

  useEffect(() => {
    function handleESpaceChainChange() {
      setRefreshTick((current) => current + 1);
    }

    const provider = getSelectedESpaceWallet(eSpaceWalletId).selectedWallet?.provider;
    provider?.on?.("chainChanged", handleESpaceChainChange);

    return () => {
      provider?.removeListener?.("chainChanged", handleESpaceChainChange);
    };
  }, [eSpaceWalletId]);

  useEffect(() => {
    if (!coreAddress) {
      setCoreNetwork({ tone: "neutral", label: "Idle" });
      return;
    }

    if (coreChainHint === null) {
      setCoreNetwork({ tone: "neutral", label: "Connected" });
      return;
    }

    setCoreNetwork(
      coreChainHint === coreNetworkId
        ? { tone: "good", label: "Core testnet" }
        : { tone: "warning", label: `Wrong net ${coreChainHint}` },
    );
  }, [coreAddress, coreChainHint, coreNetworkId, refreshTick]);

  useEffect(() => {
    let cancelled = false;

    async function refreshESpaceNetwork() {
      if (!eSpaceAddress) {
        setESpaceNetwork({ tone: "neutral", label: "Idle" });
        return;
      }

      const provider = getSelectedESpaceWallet(eSpaceWalletId).selectedWallet?.provider;

      if (!provider?.request) {
        setESpaceNetwork({ tone: "warning", label: "No wallet" });
        return;
      }

      try {
        const chainId = await provider.request({ method: "eth_chainId" });
        if (cancelled) return;
        const currentChain = parseRpcNumber(chainId);
        setESpaceNetwork(
          currentChain === eSpaceChainId
            ? { tone: "good", label: "eSpace testnet" }
            : { tone: "warning", label: `Wrong net ${Number.isNaN(currentChain) ? "?" : currentChain}` },
        );
      } catch {
        if (!cancelled) {
          setESpaceNetwork({ tone: "warning", label: "Status error" });
        }
      }
    }

    refreshESpaceNetwork();
    return () => {
      cancelled = true;
    };
  }, [eSpaceAddress, eSpaceChainId, eSpaceWalletId, isOpen, refreshTick]);

  async function handleRefresh() {
    setIsRefreshing(true);
    try {
      await Promise.allSettled([refreshCore(), refreshESpace()]);
      setRefreshTick((current) => current + 1);
    } finally {
      setIsRefreshing(false);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className={
          isConnected
            ? "inline-flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-full px-4 py-2 transition-colors"
            : "inline-flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-full px-4 py-2 text-sm font-medium text-white transition-colors"
        }
      >
        {isConnected ? (
          <>
            <span className="w-2 h-2 rounded-full bg-[#42D293] shadow-[0_0_8px_#42D293] animate-pulse" />
            <span className="font-mono text-sm text-zinc-200">{truncateAddress(primaryAddress, 5)}</span>
          </>
        ) : (
          <>
            <Wallet className="w-4 h-4" />
            Connect Wallet
          </>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, scale: 0.9, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -5, transition: { duration: 0.2 } }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="absolute right-0 mt-2 w-80 z-50 origin-top-right"
          >
            <BorderGlow
              edgeSensitivity={30}
              glowColor="150 80 60"
              backgroundColor="#0A0A0A"
              borderRadius={28}
              glowRadius={40}
              glowIntensity={0.95}
              coneSpread={25}
              animated={false}
              colors={["#42D293", "#34d399", "#22c55e"]}
              className="w-full p-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-2">
                <span className="text-sm font-semibold text-white tracking-wide">Wallets</span>
                <button onClick={handleRefresh} disabled={isRefreshing} className="text-zinc-400 hover:text-white transition-colors disabled:opacity-50">
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
                </button>
              </div>

              <div className="flex flex-col">
                <WalletPanel
                  label="Core"
                  accent="bg-[#42D293] text-[#42D293]"
                  address={coreAddress}
                  network={coreNetwork}
                  helper=""
                  connect={connectCore}
                  disconnect={disconnectCore}
                />
                <WalletPanel
                  label="eSpace"
                  accent="bg-cyan-400 text-cyan-400"
                  address={eSpaceAddress}
                  network={eSpaceNetwork}
                  helper=""
                  walletName={eSpaceWalletName}
                  walletId={eSpaceWalletId}
                  walletOptions={eSpaceWallets}
                  selectWallet={selectESpaceWallet}
                  connect={connectESpace}
                  disconnect={disconnectESpace}
                />
              </div>
            </BorderGlow>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
