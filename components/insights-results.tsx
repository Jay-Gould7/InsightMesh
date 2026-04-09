"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";

import { AntiSybilPanel } from "@/components/anti-sybil-panel";
import { ClusterChart } from "@/components/cluster-chart";
import { RewardSummary } from "@/components/reward-summary";
import { ScoreTable } from "@/components/score-table";
import { SettlementPanel } from "@/components/settlement-panel";
import { INSIGHTS_PREVIEW_EVENT, type InsightsPreviewPayload } from "@/lib/insights-preview";
import type { AnalysisCluster, DisqualifiedSubmission, InsightHighlight, SurveyQuestion } from "@/lib/types";

type ScoreEntryLike = {
  submissionId: number;
  participationPts: number;
  qualityPts: number;
  discoveryBonus: number;
  consensusBonus: number;
  totalPoints: number;
  rewardAmount: string | null;
  payoutAddress?: string;
  summary?: string;
  rank?: number | null;
  submission?: {
    payoutAddress?: string;
    summary?: string;
    answers?: Record<string, unknown>;
  } | null;
};

export function InsightsResults({
  bountyId,
  questions,
  creatorAddress,
  settled,
  settlementTx,
  initialClusters,
  initialHighlights,
  initialDisqualified,
  scoreSnapshot,
}: {
  bountyId: number;
  questions: SurveyQuestion[];
  creatorAddress: string;
  settled: boolean;
  settlementTx?: string | null;
  initialClusters: AnalysisCluster[];
  initialHighlights: InsightHighlight[];
  initialDisqualified: DisqualifiedSubmission[];
  scoreSnapshot:
    | {
        snapshotKey: string;
        entries: ScoreEntryLike[];
      }
    | null;
}) {
  const [preview, setPreview] = useState<InsightsPreviewPayload>(null);

  useEffect(() => {
    function handlePreview(event: Event) {
      const customEvent = event as CustomEvent<{ preview: InsightsPreviewPayload }>;
      setPreview(customEvent.detail?.preview ?? null);
    }

    window.addEventListener(INSIGHTS_PREVIEW_EVENT, handlePreview as EventListener);
    return () => window.removeEventListener(INSIGHTS_PREVIEW_EVENT, handlePreview as EventListener);
  }, []);

  const clusters = preview?.clusters ?? initialClusters;
  const highlights = preview?.highlights ?? initialHighlights;
  const disqualified = preview?.disqualified ?? initialDisqualified;

  return (
    <>
      {clusters.length > 0 ? (
        <div className="relative z-10 mt-10 space-y-6 overflow-visible">
          <ClusterChart clusters={clusters} />

          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-lime-400/10">
                <Star className="h-5 w-5 text-lime-400" />
              </div>
              <h3 className="text-2xl font-semibold tracking-tight text-white">AI-Distilled Highlights</h3>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {highlights.map((highlight) => (
                <div
                  key={`${highlight.submissionId}-${highlight.title}`}
                  className="group relative flex flex-col justify-between rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-lime-500/30 hover:bg-black/60 hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)]"
                >
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-white/[0.04] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="relative z-10">
                    <div className="mb-4 flex items-start justify-between gap-4">
                      <p className="font-semibold leading-snug text-white">{highlight.title}</p>
                      <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-lime-400/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-lime-400">
                        +{highlight.bonusPoints} PTS
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed text-stone-400">{highlight.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {scoreSnapshot ? (
        <div className="space-y-10 border-t border-white/10 pt-8">
          <section className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-lime-300/70">Frozen ranking</p>
              <h2 className="mt-2 text-3xl font-semibold text-white">Creator-ready score snapshot</h2>
            </div>

            <div className="grid gap-8 lg:grid-cols-[1fr_0.85fr]">
              <div className="space-y-6">
                <ScoreTable entries={scoreSnapshot.entries} questions={questions} />
                <RewardSummary entries={scoreSnapshot.entries} settlementTx={settlementTx} />
              </div>
              <div className="space-y-6">
                <SettlementPanel
                  panelId={`settlement-panel-${bountyId}`}
                  bountyId={bountyId}
                  snapshotKey={scoreSnapshot.snapshotKey}
                  creatorAddress={creatorAddress}
                  settled={settled}
                />
                <AntiSybilPanel disqualified={disqualified} />
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
