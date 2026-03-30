import Link from "next/link";
import { notFound } from "next/navigation";

import { CreatorGate } from "@/components/creator-gate";
import { RewardSummary } from "@/components/reward-summary";
import { ScoreTable } from "@/components/score-table";
import { SettlementPanel } from "@/components/settlement-panel";
import { getBountyDetail } from "@/lib/db/queries";

export default async function BountySettlePage({ params }: { params: Promise<{ id: string }> }) {
  const resolved = await params;
  const bounty = await getBountyDetail(Number(resolved.id));
  if (!bounty) notFound();

  return (
    <CreatorGate creatorCoreAddress={bounty.creatorCoreAddress} bountyId={bounty.id}>
      <div className="space-y-8">
        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.35em] text-lime-300/70">Settlement control room</p>
          <h1 className="mt-2 text-4xl font-semibold text-white">{bounty.title}</h1>
          <p className="mt-3 text-base leading-8 text-stone-300">Creator confirmation signs off on the snapshot, then the relayer distributes the reward pool on eSpace.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={`/bounty/${bounty.id}/insights`} className="rounded-full border border-white/15 px-4 py-2 text-sm text-white">Back to insights</Link>
          </div>
        </section>

        {!bounty.scoreSnapshot ? (
          <div className="rounded-3xl border border-dashed border-white/10 px-6 py-12 text-center text-stone-400">Freeze a score snapshot in the insights page before you try to settle.</div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
            <div className="space-y-6">
              <ScoreTable entries={bounty.scoreSnapshot.entries} />
              <RewardSummary entries={bounty.scoreSnapshot.entries} settlementTx={bounty.settlementTx} />
            </div>
            <SettlementPanel bountyId={bounty.id} snapshotKey={bounty.scoreSnapshot.snapshotKey} creatorAddress={bounty.creatorEspaceAddress} settled={bounty.status === "SETTLED"} />
          </div>
        )}
      </div>
    </CreatorGate>
  );
}
