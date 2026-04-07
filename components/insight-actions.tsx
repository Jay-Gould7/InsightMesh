"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

import { useFluentWallet } from "@/components/providers/fluent-provider";
import { INSIGHTS_ANALYSIS_EVENT } from "@/lib/insights-wave";

export function InsightActions({ bountyId }: { bountyId: number }) {
  const router = useRouter();
  const { address } = useFluentWallet();
  const [preview, setPreview] = useState<any | null>(null);
  const [error, setError] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFreezing, setIsFreezing] = useState(false);

  function emitAnalysisState(active: boolean) {
    if (typeof window === "undefined") {
      return;
    }

    window.dispatchEvent(new CustomEvent(INSIGHTS_ANALYSIS_EVENT, { detail: { active } }));
  }

  async function analyze() {
    if (!address) {
      setError("Connect your Core wallet first.");
      return;
    }

    setError("");
    setIsAnalyzing(true);
    emitAnalysisState(true);

    try {
      const response = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bountyId, callerAddress: address }),
      });
      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error ?? "Unable to analyze feedback.");
        return;
      }

      setPreview(payload);
    } catch (analyzeError) {
      setError(analyzeError instanceof Error ? analyzeError.message : "Unable to analyze feedback.");
    } finally {
      setIsAnalyzing(false);
      emitAnalysisState(false);
    }
  }

  async function freezeSnapshot() {
    if (!address) {
      setError("Connect your Core wallet first.");
      return;
    }

    setError("");
    setIsFreezing(true);

    const response = await fetch("/api/ai/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bountyId, callerAddress: address }),
    });
    const payload = await response.json();
    setIsFreezing(false);

    if (!response.ok) {
      setError(payload.error ?? "Unable to freeze score snapshot.");
      return;
    }

    setPreview(payload);
    startTransition(() => router.refresh());
  }

  return (
    <div className="flex w-full flex-col items-start gap-3 lg:items-end">
      <div className="flex w-full flex-wrap gap-3 lg:w-auto lg:justify-end">
        <button
          onClick={analyze}
          disabled={isAnalyzing || !address}
          className="rounded-full bg-cyan-300 px-4 py-2 text-sm font-semibold text-stone-900 transition-opacity disabled:opacity-60"
        >
          {isAnalyzing ? "Analyzing..." : "Preview analysis"}
        </button>
        <button
          onClick={freezeSnapshot}
          disabled={isFreezing || !address}
          className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
        >
          {isFreezing ? "Freezing..." : "Freeze score snapshot"}
        </button>
      </div>

      {error ? <p className="text-sm text-rose-300 lg:text-right">{error}</p> : null}

      {preview ? (
        <div className="text-sm text-stone-300 lg:text-right">
          <p>
            {preview.clusters?.length ?? 0} clusters / {preview.highlights?.length ?? 0} highlights
          </p>
          {preview.snapshotKey ? (
            <p className="mt-1 text-xs text-stone-500">snapshot: {preview.snapshotKey}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
