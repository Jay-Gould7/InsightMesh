"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

import { useFluentWallet } from "@/components/providers/fluent-provider";

export function InsightActions({ bountyId }: { bountyId: number }) {
  const router = useRouter();
  const { address } = useFluentWallet();
  const [preview, setPreview] = useState<any | null>(null);
  const [error, setError] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFreezing, setIsFreezing] = useState(false);

  async function analyze() {
    if (!address) { setError("Connect your Core wallet first."); return; }
    setError("");
    setIsAnalyzing(true);
    const response = await fetch("/api/ai/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bountyId, callerAddress: address }) });
    const payload = await response.json();
    setIsAnalyzing(false);
    if (!response.ok) { setError(payload.error ?? "Unable to analyze feedback."); return; }
    setPreview(payload);
  }

  async function freezeSnapshot() {
    if (!address) { setError("Connect your Core wallet first."); return; }
    setError("");
    setIsFreezing(true);
    const response = await fetch("/api/ai/score", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bountyId, callerAddress: address }) });
    const payload = await response.json();
    setIsFreezing(false);
    if (!response.ok) { setError(payload.error ?? "Unable to freeze score snapshot."); return; }
    setPreview(payload);
    startTransition(() => router.refresh());
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      <p className="text-xs uppercase tracking-[0.35em] text-lime-300/70">Insight engine</p>
      <h3 className="mt-2 text-xl font-semibold text-white">Generate or freeze the creator snapshot</h3>
      <div className="mt-5 flex flex-wrap gap-3">
        <button onClick={analyze} disabled={isAnalyzing || !address} className="rounded-full bg-cyan-300 px-4 py-2 text-sm font-semibold text-stone-900 disabled:opacity-60">{isAnalyzing ? "Analyzing..." : "Preview analysis"}</button>
        <button onClick={freezeSnapshot} disabled={isFreezing || !address} className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{isFreezing ? "Freezing..." : "Freeze score snapshot"}</button>
      </div>
      {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
      {preview ? <div className="mt-4 rounded-2xl border border-white/8 bg-black/10 p-4 text-sm text-stone-300"><p>{preview.clusters?.length ?? 0} clusters · {preview.highlights?.length ?? 0} highlights</p>{preview.snapshotKey ? <p className="mt-1 text-xs text-stone-500">snapshot: {preview.snapshotKey}</p> : null}</div> : null}
    </div>
  );
}
