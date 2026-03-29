import Link from "next/link";
import { notFound } from "next/navigation";

import { SupportButton } from "@/components/support-button";
import { SurveyForm } from "@/components/survey-form";
import { StatusPill } from "@/components/status-pill";
import { getBountyDetail } from "@/lib/db/queries";
import { env } from "@/lib/env";
import { formatDate } from "@/lib/utils";

export default async function BountyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolved = await params;
  const bounty = await getBountyDetail(Number(resolved.id));
  if (!bounty) notFound();

  const coreConfig = {
    mode: env.demoMode ? "demo" : "wallet",
    networkId: env.coreNetworkId,
    rpcUrl: env.coreRpcUrl,
    bountyRegistryAddress: env.coreRegistryAddress,
    submissionRegistryAddress: env.coreSubmissionAddress,
    rewardDecimals: 6,
  } as const;

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-lime-300/70">Bounty detail</p>
            <h1 className="mt-2 text-4xl font-semibold text-white">{bounty.title}</h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-stone-300">{bounty.description}</p>
          </div>
          <StatusPill status={bounty.status} />
        </div>
        <div className="mt-6 flex flex-wrap gap-6 text-sm text-stone-300">
          <div><p className="text-xs uppercase tracking-[0.3em] text-stone-500">Deadline</p><p className="mt-2 text-white">{formatDate(bounty.deadline)}</p></div>
          <div><p className="text-xs uppercase tracking-[0.3em] text-stone-500">Reward</p><p className="mt-2 text-white">{bounty.rewardAmount} USDT0</p></div>
          <div><p className="text-xs uppercase tracking-[0.3em] text-stone-500">Insight status</p><p className="mt-2 text-white">{bounty.analysisStatus}</p></div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={`/bounty/${bounty.id}/insights`} className="rounded-full border border-white/15 px-4 py-2 text-sm text-white">Open insights</Link>
          <Link href={`/bounty/${bounty.id}/settle`} className="rounded-full border border-white/15 px-4 py-2 text-sm text-white">Settlement</Link>
        </div>
      </section>

      <SurveyForm bounty={bounty} coreConfig={coreConfig} />

      <section className="grid gap-4 lg:grid-cols-2">
        {bounty.submissions.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 px-6 py-12 text-center text-stone-400 lg:col-span-2">No community responses yet. Submit the first one above.</div>
        ) : (
          bounty.submissions.map((submission: any) => (
            <article key={submission.id} className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-stone-500">Submission #{submission.id}</p>
                  <p className="mt-2 text-lg font-medium text-white">{submission.summary}</p>
                </div>
                <div className="rounded-full bg-white/5 px-3 py-1 text-sm text-stone-300">{submission.supportCount} supports</div>
              </div>
              <div className="mt-5">
                <SupportButton
                  bountyId={bounty.id}
                  chainBountyId={bounty.chainBountyId}
                  submissionId={submission.id}
                  chainSubmissionId={submission.coreSubmissionId}
                  coreConfig={coreConfig}
                />
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
