import { Star } from "lucide-react";
import { notFound } from "next/navigation";

import { BackToBountyButton } from "@/components/back-to-bounty-button";
import { ClusterChart } from "@/components/cluster-chart";
import { CreatorGate } from "@/components/creator-gate";
import { InsightActions } from "@/components/insight-actions";
import { InsightsWaveOverlay } from "@/components/insights-wave-overlay";
import { ScoreTable } from "@/components/score-table";
import { RewardSummary } from "@/components/reward-summary";
import { SettlementPanel } from "@/components/settlement-panel";
import { AntiSybilPanel } from "@/components/anti-sybil-panel";
import { getBountyDetail } from "@/lib/db/queries";
import LightRays from "@/components/reactbits/LightRays";

export default async function BountyInsightsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolved = await params;
  const bounty = await getBountyDetail(Number(resolved.id));
  if (!bounty) notFound();

  const clusters = (bounty.analysis?.clusters as any[]) ?? [];
  const highlights = (bounty.analysis?.highlights as any[]) ?? [];

  return (
    <CreatorGate creatorCoreAddress={bounty.creatorCoreAddress} bountyId={bounty.id}>
      <div className="fixed top-0 left-0 w-full h-[100vh] z-0 pointer-events-none">
        <LightRays
          raysOrigin="top-center"
          raysColor="#3dc389"
          raysSpeed={1.5}
          lightSpread={0.5}
          rayLength={3}
          followMouse={true}
          mouseInfluence={0.1}
          noiseAmount={0.1}
          distortion={0}
          className="custom-rays opacity-40"
          pulsating={false}
          fadeDistance={2}
          saturation={1}
        />
      </div>

      <div className="relative z-10 space-y-16">
        <section className="px-2 pt-2">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.35em] text-lime-300/70">Insight & Settlement Room</p>
              <h1 className="mt-2 text-4xl font-semibold text-white">{bounty.title}</h1>
              <p className="mt-3 text-base leading-8 text-stone-300">Preview AI clustering, freeze the snapshot, and distribute the reward pool securely.</p>
            </div>
            <div className="flex w-full flex-col items-start gap-4 lg:w-auto lg:items-end">
              <BackToBountyButton bountyId={bounty.id} />
              <InsightActions bountyId={bounty.id} />
            </div>
          </div>
        </section>

        <div className="relative h-0 overflow-visible">
          <InsightsWaveOverlay />
        </div>

        {clusters.length > 0 ? (
          <div className="relative space-y-6 overflow-visible">
            <ClusterChart clusters={clusters as any} />

            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-lime-400/10">
                  <Star className="h-5 w-5 text-lime-400" />
                </div>
                <h3 className="text-2xl font-semibold tracking-tight text-white">AI-Distilled Highlights</h3>
              </div>
              
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {highlights.map((highlight: any) => (
                  <div key={`${highlight.submissionId}-${highlight.title}`} className="group relative flex flex-col justify-between rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-lime-500/30 hover:bg-black/60 hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-white/[0.04] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <div className="relative z-10">
                      <div className="mb-4 flex items-start justify-between gap-4">
                        <p className="font-semibold text-white leading-snug">{highlight.title}</p>
                        <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-lime-400/10 px-2.5 py-1 text-[11px] font-bold text-lime-400 uppercase tracking-wider">
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

        {bounty.scoreSnapshot ? (
          <div className="space-y-10 pt-8 border-t border-white/10">
            <section className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-lime-300/70">Frozen ranking</p>
                <h2 className="mt-2 text-3xl font-semibold text-white">Creator-ready score snapshot</h2>
              </div>
              
              <div className="grid gap-8 lg:grid-cols-[1fr_0.85fr]">
                <div className="space-y-6">
                  <ScoreTable entries={bounty.scoreSnapshot.entries} questions={bounty.questions as any} />
                  <RewardSummary entries={bounty.scoreSnapshot.entries} settlementTx={bounty.settlementTx} />
                </div>
                <div className="space-y-6">
                  <SettlementPanel bountyId={bounty.id} snapshotKey={bounty.scoreSnapshot.snapshotKey} creatorAddress={bounty.creatorEspaceAddress} settled={bounty.status === "SETTLED"} />
                  {bounty.analysis?.disqualified !== undefined && (
                     <AntiSybilPanel disqualified={bounty.analysis.disqualified as any} />
                  )}
                </div>
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </CreatorGate>
  );
}
