import { notFound } from "next/navigation";

import { StatusPill } from "@/components/status-pill";
import { SubmissionList } from "@/components/submission-list";
import { SurveyForm } from "@/components/survey-form";
import { BountyDetailToolbar } from "@/components/bounty-detail-toolbar";
import { BountyPageFlow } from "@/components/bounty-page-flow";
import LightRays from "@/components/reactbits/LightRays";
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

  return (
    <div className="relative isolate">
      <div className="fixed left-0 top-0 z-0 h-[100vh] w-full pointer-events-none">
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

      <BountyPageFlow visible={activeTab === "respond"} />

      <div className="relative z-10 space-y-8">
        <section className="px-2 pt-2">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-lime-300/70">Bounty detail</p>
              <h1 className="mt-2 text-4xl font-semibold text-white">{bounty.title}</h1>
              <p className="mt-4 max-w-3xl text-base leading-8 text-stone-300">{bounty.description}</p>
            </div>
            <StatusPill status={bounty.status} />
          </div>
          <div className="mt-6 flex flex-wrap gap-6 text-sm text-stone-300">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-stone-500">Deadline</p>
              <p className="mt-2 text-white">{formatDate(bounty.deadline)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-stone-500">Reward</p>
              <p className="mt-2 text-white">{bounty.rewardAmount} USDT0</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-stone-500">Insight status</p>
              <p className="mt-2 text-white">{bounty.analysisStatus}</p>
            </div>
          </div>
        </section>

        <BountyDetailToolbar
          bountyId={bounty.id}
          activeTab={activeTab}
          creatorCoreAddress={bounty.creatorCoreAddress}
        />

        <div className="min-h-[400px]">
          {activeTab === "respond" ? (
            <SurveyForm bounty={bounty} coreConfig={coreConfig} />
          ) : (
            <SubmissionList bounty={bounty} coreConfig={coreConfig} />
          )}
        </div>
      </div>
    </div>
  );
}
