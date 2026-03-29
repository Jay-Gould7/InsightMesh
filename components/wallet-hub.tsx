"use client";

import { ChevronDown, Copy, LogOut, RefreshCw, Wallet } from "lucide-react";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

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
  if (tone === "good") return "border-emerald-400/30 bg-emerald-400/10 text-emerald-100";
  if (tone === "warning") return "border-amber-300/30 bg-amber-300/10 text-amber-100";
  return "border-white/10 bg-white/5 text-stone-300";
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

  const isPrimary = emphasis === "primary";

  return (
    <section className={isPrimary ? "rounded-3xl border border-white/10 bg-black/20 p-4" : "rounded-[1.6rem] border border-cyan-300/12 bg-cyan-300/5 p-4"}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className={`h-2.5 w-2.5 rounded-full ${accent}`} />
            <p className="text-xs uppercase tracking-[0.35em] text-stone-400">{label}</p>
          </div>
          <p className="text-sm text-stone-300">{helper}</p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.25em] ${toneClasses(network.tone)}`}>
          {network.label}
        </span>
      </div>

      {walletOptions?.length ? (
        <label className="mt-4 block">
          <span className="text-xs uppercase tracking-[0.3em] text-stone-500">Wallet app</span>
          <select
            value={walletId}
            onChange={(event) => void handleWalletSelect(event.target.value)}
            disabled={isBusy}
            className="mt-2 w-full rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-sm text-white outline-none disabled:opacity-60"
          >
            {walletOptions.map((wallet) => (
              <option key={wallet.id} value={wallet.id} className="bg-[#09120d]">
                {wallet.name}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-stone-500">
            {walletName ? `Current provider: ${walletName}` : "Choose which EVM wallet extension InsightMesh should talk to."}
          </p>
        </label>
      ) : null}

      <div className={`mt-4 rounded-2xl px-4 py-3 ${isPrimary ? "border border-white/8 bg-white/5" : "border border-cyan-300/10 bg-black/20"}`}>
        <p className="text-xs uppercase tracking-[0.3em] text-stone-500">Active account</p>
        <p className="mt-2 text-sm text-white">
          {address ? truncateAddress(address, 10) : "Not connected"}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {address ? (
          <>
            <button
              type="button"
              onClick={handleCopy}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs ${isPrimary ? "border border-white/10 text-white" : "border border-cyan-300/15 text-cyan-50"}`}
            >
              <Copy className="h-3.5 w-3.5" />
              {copied ? "Copied" : "Copy"}
            </button>
            <button
              type="button"
              onClick={disconnect}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs ${isPrimary ? "border border-white/10 text-stone-200" : "border border-cyan-300/15 text-stone-200"}`}
            >
              <LogOut className="h-3.5 w-3.5" />
              Disconnect
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={handleConnect}
            disabled={isBusy}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs disabled:opacity-60 ${isPrimary ? "border border-white/10 text-white" : "border border-cyan-300/15 text-cyan-50"}`}
          >
            <Wallet className="h-3.5 w-3.5" />
            {isBusy ? "Connecting..." : `Connect ${label}`}
          </button>
        )}
      </div>

      {error ? <p className="mt-3 text-xs text-rose-300">{error}</p> : null}
    </section>
  );
}

export function WalletHub({ coreNetworkId, eSpaceChainId }: WalletHubProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isESpaceExpanded, setIsESpaceExpanded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const [panelStyle, setPanelStyle] = useState({ top: 0, left: 0 });
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
  const buttonLabel = useMemo(() => {
    if (connectedCount === 0) return "Connect Wallets";
    if (connectedCount === 2) return "2 Wallets Connected";
    return "1 Wallet Connected";
  }, [connectedCount]);

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

  useLayoutEffect(() => {
    if (!isOpen) return;

    function updatePanelPosition() {
      const trigger = rootRef.current;
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      const panelWidth = Math.min(window.innerWidth * 0.92, 480);
      const horizontalPadding = 16;
      const left = Math.min(
        Math.max(horizontalPadding, rect.right - panelWidth),
        window.innerWidth - panelWidth - horizontalPadding,
      );

      setPanelStyle({
        top: rect.bottom + 12,
        left,
      });
    }

    updatePanelPosition();
    window.addEventListener("resize", updatePanelPosition);
    window.addEventListener("scroll", updatePanelPosition, true);

    return () => {
      window.removeEventListener("resize", updatePanelPosition);
      window.removeEventListener("scroll", updatePanelPosition, true);
    };
  }, [isOpen, buttonLabel]);

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
        className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm text-white shadow-[0_16px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl"
      >
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-lime-300 to-cyan-300 text-stone-900">
          <Wallet className="h-4 w-4" />
        </span>
        <div className="text-left">
          <p className="text-[10px] uppercase tracking-[0.3em] text-stone-400">Wallet hub</p>
          <p className="text-sm text-white">{buttonLabel}</p>
        </div>
        <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-stone-300">
          {connectedCount}/2
        </span>
        <ChevronDown className={`h-4 w-4 text-stone-300 transition ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={panelRef}
              className="fixed z-[9999] w-[min(92vw,30rem)] rounded-[2rem] border border-white/10 bg-[#09120d]/95 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.42)] backdrop-blur-2xl"
              style={{ top: panelStyle.top, left: panelStyle.left }}
            >
              <div className="flex items-center justify-between gap-3 px-2 pb-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-lime-300/70">Wallet control</p>
                  <h3 className="mt-2 text-xl font-semibold text-white">Core first</h3>
                </div>
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs text-stone-200 disabled:opacity-60"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                  {isRefreshing ? "Refreshing..." : "Refresh"}
                </button>
              </div>

              <div className="grid gap-3">
                <WalletPanel
                  label="Core"
                  accent="bg-lime-300"
                  address={coreAddress}
                  network={coreNetwork}
                  helper="Use Fluent for the main flow on Core Space."
                  connect={connectCore}
                  disconnect={disconnectCore}
                />
                <section className="rounded-[1.4rem] border border-cyan-300/10 bg-cyan-300/4 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => setIsESpaceExpanded((current) => !current)}
                    className="flex w-full items-center justify-between gap-3 text-left"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="h-2.5 w-2.5 rounded-full bg-cyan-300" />
                      <div>
                        <p className="text-xs uppercase tracking-[0.35em] text-stone-400">eSpace</p>
                        <p className="mt-1 text-sm text-stone-300">
                          {eSpaceAddress ? truncateAddress(eSpaceAddress, 8) : "Optional for payout autofill and settlement"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.25em] ${toneClasses(eSpaceNetwork.tone)}`}>
                        {eSpaceNetwork.label}
                      </span>
                      <ChevronDown className={`h-4 w-4 text-stone-300 transition ${isESpaceExpanded ? "rotate-180" : ""}`} />
                    </div>
                  </button>

                  {isESpaceExpanded ? (
                    <div className="mt-3">
                      <WalletPanel
                        label="eSpace"
                        accent="bg-cyan-300"
                        address={eSpaceAddress}
                        network={eSpaceNetwork}
                        emphasis="secondary"
                        helper="Optional. Mainly for creator funding, settlement, or autofill."
                        walletName={eSpaceWalletName}
                        walletId={eSpaceWalletId}
                        walletOptions={eSpaceWallets}
                        selectWallet={selectESpaceWallet}
                        connect={connectESpace}
                        disconnect={disconnectESpace}
                      />
                    </div>
                  ) : null}
                </section>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
