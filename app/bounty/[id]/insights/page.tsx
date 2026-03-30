import Link from "next/link";
import { notFound } from "next/navigation";

import { ClusterChart } from "@/components/cluster-chart";
import { CreatorGate } from "@/components/creator-gate";
import { InsightActions } from "@/components/insight-actions";
import { ScoreTable } from "@/components/score-table";
import { getBountyDetail } from "@/lib/db/queries";

export default async function BountyInsightsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolved = await params;
  const bounty = await getBountyDetail(Number(resolved.id));
  if (!bounty) notFound();

  const clusters = (bounty.analysis?.clusters as any[]) ?? [];
  const highlights = (bounty.analysis?.highlights as any[]) ?? [];

  return (
    <CreatorGate creatorCoreAddress={bounty.creatorCoreAddress} bountyId={bounty.id}>
      <div className="space-y-8">
        <section className="flex flex-wrap items-end justify-between gap-4 rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-lime-300/70">Insight room</p>
            <h1 className="mt-2 text-4xl font-semibold text-white">{bounty.title}</h1>
            <p className="mt-3 text-base leading-8 text-stone-300">Preview AI clustering or freeze the snapshot that will drive the final payout.</p>
          </div>
          <Link href={`/bounty/${bounty.id}/settle`} className="rounded-full border border-white/15 px-4 py-2 text-sm text-white">Go to settlement</Link>
        </section>

        <InsightActions bountyId={bounty.id} />

        {clusters.length > 0 ? (
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <ClusterChart clusters={clusters as any} />
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.35em] text-lime-300/70">Highlights</p>
              <div className="mt-4 space-y-3">
                {highlights.map((highlight: any) => (
                  <div key={`${highlight.submissionId}-${highlight.title}`} className="rounded-2xl border border-white/8 bg-black/10 p-4">
                    <p className="font-medium text-white">{highlight.title}</p>
                    <p className="mt-2 text-sm leading-6 text-stone-300">{highlight.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {bounty.scoreSnapshot ? (
          <section className="space-y-4">
            <div><p className="text-xs uppercase tracking-[0.35em] text-lime-300/70">Frozen ranking</p><h2 className="mt-2 text-3xl font-semibold text-white">Creator-ready score snapshot</h2></div>
            <ScoreTable entries={bounty.scoreSnapshot.entries} />
          </section>
        ) : null}
      </div>
    </CreatorGate>
  );
}
