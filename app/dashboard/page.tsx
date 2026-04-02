import Link from "next/link";
import LightRays from "@/components/reactbits/LightRays";

import { BountyCard } from "@/components/bounty-card";
import { DashboardControls } from "@/components/dashboard-controls";
import { listVisibleBounties } from "@/lib/db/queries";
import { BountyStatus } from "@prisma/client";

export default async function DashboardPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const q = typeof searchParams.q === "string" ? searchParams.q : undefined;
  const status = typeof searchParams.status === "string" ? (searchParams.status as BountyStatus) : undefined;
  const page = typeof searchParams.page === "string" ? parseInt(searchParams.page) : 1;

  const { bounties, totalPages, stats } = await listVisibleBounties({
    search: q,
    status,
    page,
  });

  const activeCount = stats.ACTIVE + stats.ANALYZING;
  const readyCount = stats.READY_TO_SETTLE;
  const settledCount = stats.SETTLED;
  const totalSubmissions = stats.submissions;

  return (
    <>
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
      <div className="space-y-8 relative z-10">
        <section className="grid gap-4 md:grid-cols-4">
          {[
            ["Active Campaigns", activeCount],
            ["Ready to settle", readyCount],
            ["Settled", settledCount],
            ["Total Responses", totalSubmissions],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.35em] text-lime-300/70">{label}</p>
              <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
            </div>
          ))}
        </section>

        <section className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-lime-300/70">Database-backed overview</p>
              <h1 className="mt-2 text-4xl font-semibold text-white">All campaigns in one place</h1>
            </div>
            <Link href="/bounty/new" className="rounded-full border border-white/15 px-4 py-2 text-sm text-white">
              Launch another bounty
            </Link>
          </div>

          {/* Controls: Search, Filter, Pagination */}
          <DashboardControls totalCount={0} totalPages={totalPages} currentPage={page} />

          {bounties.length > 0 ? (
            <div className="grid gap-6">
              {bounties.map((bounty) => (
                <BountyCard key={bounty.id} bounty={bounty} />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-white/10 p-20 text-center">
              <p className="text-stone-500">No campaigns found matching your filters.</p>
              <Link href="/dashboard" className="mt-4 inline-block text-sm text-lime-300 underline underline-offset-4">
                Clear all filters
              </Link>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
