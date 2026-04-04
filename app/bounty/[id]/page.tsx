import Link from "next/link";
import { notFound } from "next/navigation";

import { StatusPill } from "@/components/status-pill";
import { SubmissionList } from "@/components/submission-list";
import { SurveyForm } from "@/components/survey-form";
import { CreatorLinks } from "@/components/creator-links";
import PillNav from "@/components/reactbits/PillNav";
import { BackButton } from "@/components/back-button";
import { getBountyDetail } from "@/lib/db/queries";
import { env } from "@/lib/env";
import { formatDate } from "@/lib/utils";

export default async function BountyDetailPage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const [resolvedParams, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const bounty = await getBountyDetail(Number(resolvedParams.id));
  if (!bounty) notFound();

  const activeTab = resolvedSearchParams.tab || "respond";

  const coreConfig = {
    mode: env.demoMode ? "demo" : "wallet",
    networkId: env.coreNetworkId,
    rpcUrl: env.coreRpcUrl,
    bountyRegistryAddress: env.coreRegistryAddress,
    submissionRegistryAddress: env.coreSubmissionAddress,
    rewardDecimals: 6,
  } as const;

  const navItems = [
    { label: "Respond", href: `/bounty/${bounty.id}?tab=respond` },
    { label: "Submissions", href: `/bounty/${bounty.id}?tab=submissions` },
  ];

  const activeHref = `/bounty/${bounty.id}?tab=${activeTab}`;

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
      </section>

      <div className="flex flex-wrap items-center gap-y-3 gap-x-4 justify-between">
        <div className="flex flex-wrap items-center gap-4">
          <BackButton />
          <div className="flex items-center">
            <PillNav
              logo=""
              items={navItems}
              activeHref={activeHref}
              bgColor="rgba(255, 255, 255, 0.02)"
              baseColor="rgba(255, 255, 255, 0.5)"
              pillColor="rgba(255, 255, 255, 0.05)"
              hoverColor="#a3e635"
              hoveredPillTextColor="#07130d"
              pillTextColor="rgba(255, 255, 255, 0.7)"
              className="scale-90 origin-left"
              initialLoadAnimation={false}
            />
          </div>
        </div>
        <CreatorLinks bountyId={bounty.id} creatorCoreAddress={bounty.creatorCoreAddress} />
      </div>

      <div className="min-h-[400px]">
        {activeTab === "respond" ? (
          <SurveyForm bounty={bounty} coreConfig={coreConfig} />
        ) : (
          <SubmissionList bounty={bounty} coreConfig={coreConfig} />
        )}
      </div>
    </div>
  );
}
