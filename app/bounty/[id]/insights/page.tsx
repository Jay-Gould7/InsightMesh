import { notFound } from "next/navigation";

import { CreatorGate } from "@/components/creator-gate";
import { InsightsResults } from "@/components/insights-results";
import { getBountyDetail } from "@/lib/db/queries";
import LightRays from "@/components/reactbits/LightRays";

export default async function BountyInsightsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolved = await params;
  const bounty = await getBountyDetail(Number(resolved.id));
  if (!bounty) notFound();

  const clusters = (bounty.analysis?.clusters as any[]) ?? [];
  const highlights = (bounty.analysis?.highlights as any[]) ?? [];
  const disqualified = (bounty.analysis?.disqualified as any[]) ?? [];
  const scoreBreakdown = (bounty.analysis?.scoreBreakdown as any[]) ?? [];

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

      <div className="relative">
        <InsightsResults
          bountyId={bounty.id}
          title={bounty.title}
          status={bounty.status}
          analysisStatus={bounty.analysisStatus}
          questions={bounty.questions as any}
          creatorAddress={bounty.creatorEspaceAddress}
          settled={bounty.status === "SETTLED"}
          settlementTx={bounty.settlementTx}
          initialClusters={clusters as any}
          initialHighlights={highlights as any}
          initialDisqualified={disqualified as any}
          initialScoreBreakdown={scoreBreakdown as any}
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
