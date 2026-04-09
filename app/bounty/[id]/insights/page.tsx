import { notFound } from "next/navigation";

import { BackToBountyButton } from "@/components/back-to-bounty-button";
import { CreatorGate } from "@/components/creator-gate";
import { InsightActions } from "@/components/insight-actions";
import { InsightsResults } from "@/components/insights-results";
import { InsightsWaveOverlay } from "@/components/insights-wave-overlay";
import { getBountyDetail } from "@/lib/db/queries";
import LightRays from "@/components/reactbits/LightRays";

export default async function BountyInsightsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolved = await params;
  const bounty = await getBountyDetail(Number(resolved.id));
  if (!bounty) notFound();

  const clusters = (bounty.analysis?.clusters as any[]) ?? [];
  const highlights = (bounty.analysis?.highlights as any[]) ?? [];
  const disqualified = (bounty.analysis?.disqualified as any[]) ?? [];

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
              <InsightActions bountyId={bounty.id} status={bounty.status} />
            </div>
          </div>
        </section>

        <div className="relative z-[70] h-0 overflow-visible">
          <InsightsWaveOverlay />
        </div>

        <InsightsResults
          bountyId={bounty.id}
          questions={bounty.questions as any}
          creatorAddress={bounty.creatorEspaceAddress}
          settled={bounty.status === "SETTLED"}
          settlementTx={bounty.settlementTx}
          initialClusters={clusters as any}
          initialHighlights={highlights as any}
          initialDisqualified={disqualified as any}
          scoreSnapshot={
            bounty.scoreSnapshot
              ? {
                  snapshotKey: bounty.scoreSnapshot.snapshotKey,
                  entries: bounty.scoreSnapshot.entries,
                }
              : null
          }
        />
      </div>
    </CreatorGate>
  );
}
