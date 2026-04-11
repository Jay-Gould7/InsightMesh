"use client";

import { useRouter } from "next/navigation";
import { startTransition, useEffect, useState } from "react";

import { useFluentWallet } from "@/components/providers/fluent-provider";
import { INSIGHTS_MANUAL_BLOCK_EVENT, INSIGHTS_PREVIEW_EVENT, type InsightsManualBlockPayload, type InsightsPreviewPayload } from "@/lib/insights-preview";
import { INSIGHTS_ANALYSIS_EVENT, MIN_INSIGHTS_ANALYSIS_WAVE_MS, type InsightsWaveMode } from "@/lib/insights-wave";
import type { AnalysisPayload } from "@/lib/types";

export function InsightActions({
  bountyId,
  status,
  initialPreviewReady = false,
}: {
  bountyId: number;
  status: string;
  initialPreviewReady?: boolean;
}) {
  const router = useRouter();
  const { address } = useFluentWallet();
  const [reviewStatus, setReviewStatus] = useState(status);
  const [preview, setPreview] = useState<AnalysisPayload | null>(null);
  const [persistedPreviewReady, setPersistedPreviewReady] = useState(initialPreviewReady);
  const [error, setError] = useState("");
  const [isLocking, setIsLocking] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFreezing, setIsFreezing] = useState(false);
  const [manualBlockedSubmissionIds, setManualBlockedSubmissionIds] = useState<number[]>([]);
  const isFrozen = reviewStatus === "READY_TO_SETTLE";
  const isSettled = reviewStatus === "SETTLED";
  const isLocked = reviewStatus === "ANALYZING";
  const actionsLocked = isFrozen || isSettled;
  const hasPreview = preview !== null || (isLocked && persistedPreviewReady);

  useEffect(() => {
    setReviewStatus(status);
    setPersistedPreviewReady(status === "ANALYZING" ? initialPreviewReady : false);
    if (status !== "ANALYZING") {
      setPreview(null);
      setManualBlockedSubmissionIds([]);
      emitPreviewState(null);
    }
  }, [initialPreviewReady, status]);

  useEffect(() => {
    function handleManualBlocks(event: Event) {
      const customEvent = event as CustomEvent<InsightsManualBlockPayload>;
      setManualBlockedSubmissionIds(customEvent.detail?.blockedSubmissionIds ?? []);
    }

    window.addEventListener(INSIGHTS_MANUAL_BLOCK_EVENT, handleManualBlocks as EventListener);
    return () => window.removeEventListener(INSIGHTS_MANUAL_BLOCK_EVENT, handleManualBlocks as EventListener);
  }, []);

  function emitWaveState(mode: InsightsWaveMode) {
    if (typeof window === "undefined") {
      return;
    }

    window.dispatchEvent(new CustomEvent(INSIGHTS_ANALYSIS_EVENT, { detail: { mode } }));
  }

  function emitPreviewState(nextPreview: InsightsPreviewPayload) {
    if (typeof window === "undefined") {
      return;
    }

    window.dispatchEvent(new CustomEvent(INSIGHTS_PREVIEW_EVENT, { detail: { preview: nextPreview } }));
  }

  async function updateReviewState(action: "lock" | "unlock") {
    if (!address) {
      setError("Connect your Core wallet first.");
      return;
    }

    setError("");
    if (action === "lock") {
      setIsLocking(true);
    } else {
      setIsUnlocking(true);
    }

    try {
      const response = await fetch(`/api/bounty/${bountyId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callerAddress: address, action }),
      });
      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error ?? `Unable to ${action} submissions.`);
        return;
      }

      if (action === "lock") {
        setReviewStatus("ANALYZING");
        setPersistedPreviewReady(false);
      } else {
        setReviewStatus("ACTIVE");
        setPersistedPreviewReady(false);
        setPreview(null);
        setManualBlockedSubmissionIds([]);
        emitPreviewState(null);
      }
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : `Unable to ${action} submissions.`);
    } finally {
      if (action === "lock") {
        setIsLocking(false);
      } else {
        setIsUnlocking(false);
      }
    }
  }

  async function analyze() {
    if (!address) {
      setError("Connect your Core wallet first.");
      return;
    }

    setError("");
    setIsAnalyzing(true);
    emitWaveState("analyzing");
    const startedAt = Date.now();

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

      setPreview(payload as AnalysisPayload);
      setPersistedPreviewReady(true);
      setManualBlockedSubmissionIds([]);
      emitPreviewState({
        clusters: payload.clusters ?? [],
        highlights: payload.highlights ?? [],
        scoreBreakdown: payload.scoreBreakdown ?? [],
        disqualified: payload.disqualified ?? [],
      });
    } catch (analyzeError) {
      setError(analyzeError instanceof Error ? analyzeError.message : "Unable to analyze feedback.");
    } finally {
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, MIN_INSIGHTS_ANALYSIS_WAVE_MS - elapsed);

      if (remaining > 0) {
        await new Promise((resolve) => setTimeout(resolve, remaining));
      }

      setIsAnalyzing(false);
      emitWaveState("idle");
    }
  }

  async function freezeSnapshot() {
    if (!address) {
      setError("Connect your Core wallet first.");
      return;
    }

    setError("");
    setIsFreezing(true);
    emitWaveState("freezing");

    try {
      const response = await fetch("/api/ai/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bountyId, callerAddress: address, manualBlockedSubmissionIds }),
      });
      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error ?? "Unable to freeze score snapshot.");
        return;
      }

      setReviewStatus("READY_TO_SETTLE");
      setPersistedPreviewReady(false);
      setPreview(null);
      emitPreviewState(null);
      startTransition(() => router.refresh());
    } catch (freezeError) {
      setError(freezeError instanceof Error ? freezeError.message : "Unable to freeze score snapshot.");
    } finally {
      setIsFreezing(false);
      emitWaveState("idle");
    }
  }

  function scrollToSettlement() {
    document.getElementById(`settlement-panel-${bountyId}`)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  const leftButtonLabel = isSettled
    ? "Settled"
    : isFrozen
      ? "Snapshot locked"
      : isLocking
        ? "Locking..."
        : isUnlocking
          ? "Unlocking..."
          : isLocked
            ? "Unlock submissions"
            : "Lock submissions";

  const rightButtonLabel = isSettled
    ? "Settled"
    : isFrozen
      ? "Go to settlement"
      : hasPreview
        ? isFreezing
          ? "Freezing..."
          : "Freeze snapshot"
        : isAnalyzing
          ? "Analyzing..."
          : "Run AI analysis";

  const rightButtonDisabled =
    isFrozen ||
    isSettled ||
    isLocking ||
    isUnlocking ||
    isFreezing ||
    (!address || !isLocked || isAnalyzing);

  const helperMessage = isSettled
    ? "This bounty is already settled."
    : isLocking
      ? "Locking submissions..."
      : isUnlocking
        ? "Reopening submissions..."
        : isAnalyzing
          ? "Generating preview..."
          : isFreezing
            ? "Freezing snapshot..."
            : isFrozen
              ? "Snapshot ready. Continue to settlement."
              : hasPreview
                ? "Analysis successful. Freeze snapshot when satisfied."
                : isLocked
                  ? "Submissions locked. Run AI analysis when ready."
                  : "Lock submissions before running AI analysis.";

  return (
    <div className="flex w-full flex-col items-start gap-3 lg:items-end">
      <div className="flex w-full flex-wrap gap-3 lg:w-auto lg:justify-end">
        <button
          onClick={() => updateReviewState(isLocked ? "unlock" : "lock")}
          disabled={!address || isLocking || isUnlocking || isAnalyzing || isFreezing || actionsLocked}
          className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
        >
          {leftButtonLabel}
        </button>
        <button
          onClick={isFrozen ? scrollToSettlement : hasPreview ? freezeSnapshot : analyze}
          disabled={rightButtonDisabled}
          className="rounded-full bg-cyan-300 px-4 py-2 text-sm font-semibold text-stone-900 transition-opacity disabled:opacity-60"
        >
          {rightButtonLabel}
        </button>
      </div>

      {error ? <p className="text-sm text-rose-300 lg:text-right">{error}</p> : null}
      {!error ? <p className="text-sm text-stone-400 lg:text-right">{helperMessage}</p> : null}
    </div>
  );
}
