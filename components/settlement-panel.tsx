"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

import { useESpaceWallet } from "@/components/providers/espace-provider";
import { buildSettlementMessage } from "@/lib/settlement";
import { truncateAddress } from "@/lib/utils";

export function SettlementPanel({ bountyId, snapshotKey, creatorAddress, settled }: { bountyId: number; snapshotKey: string; creatorAddress: string; settled: boolean }) {
  const router = useRouter();
  const { address } = useESpaceWallet();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function confirmAndSettle() {
    setError("");
    setIsSubmitting(true);
    let creatorSignature = `demo:${creatorAddress.toLowerCase()}`;
    const provider = (window as Window & { ethereum?: { request?: (args: { method: string; params?: string[] }) => Promise<string> } }).ethereum;
    if (provider?.request && address.toLowerCase() === creatorAddress.toLowerCase()) {
      creatorSignature = await provider.request({ method: "personal_sign", params: [buildSettlementMessage(bountyId, snapshotKey), address] });
    }
    const response = await fetch("/api/settle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bountyId, snapshotKey, creatorSignature }),
    });
    const payload = await response.json();
    setIsSubmitting(false);
    if (!response.ok) { setError(payload.error ?? "Unable to settle bounty."); return; }
    startTransition(() => router.refresh());
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      <p className="text-xs uppercase tracking-[0.35em] text-lime-300/70">Creator confirmation</p>
      <h3 className="mt-2 text-xl font-semibold text-white">Sign or demo-confirm the payout</h3>
      <p className="mt-3 text-sm leading-7 text-stone-300">The relayer only distributes funds after the bounty creator approves the frozen snapshot.</p>
      <div className="mt-5 space-y-2 text-sm text-stone-300">
        <span>Connected creator eSpace wallet</span>
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white">
          {address ? truncateAddress(address, 10) : "Connect eSpace in the top-right wallet hub"}
        </div>
      </div>
      <div className="mt-5 flex items-center gap-3"><button onClick={confirmAndSettle} disabled={isSubmitting || settled} className="rounded-full bg-lime-300 px-5 py-3 text-sm font-semibold text-stone-900 disabled:opacity-60">{settled ? "Already settled" : isSubmitting ? "Settling..." : "Confirm & settle"}</button></div>
      {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
    </div>
  );
}
