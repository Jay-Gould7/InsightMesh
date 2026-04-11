import Link from "next/link";
import { Activity, CheckCircle2, MessageSquareText, Timer, Plus } from "lucide-react";
import LightRays from "@/components/reactbits/LightRays";
import { RoutePrefetcher } from "@/components/route-prefetcher";

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

  const statCards = [
    { label: "Active Campaigns", value: activeCount, Icon: Activity, color: "lime" },
    { label: "Ready to Settle", value: readyCount, Icon: Timer, color: "amber" },
    { label: "Settled", value: settledCount, Icon: CheckCircle2, color: "emerald" },
    { label: "Total Responses", value: totalSubmissions, Icon: MessageSquareText, color: "cyan" },
  ] as const;

  const colorMap = {
    lime:    { icon: "text-lime-400",    bg: "bg-lime-400/10",  glow: "shadow-lime-400/20",    border: "border-lime-400/20",  accent: "from-lime-400/30" },
    amber:   { icon: "text-amber-400",   bg: "bg-amber-400/10", glow: "shadow-amber-400/20",   border: "border-amber-400/20", accent: "from-amber-400/30" },
    emerald: { icon: "text-emerald-400", bg: "bg-emerald-400/10", glow: "shadow-emerald-400/20", border: "border-emerald-400/20", accent: "from-emerald-400/30" },
    cyan:    { icon: "text-cyan-400",    bg: "bg-cyan-400/10",  glow: "shadow-cyan-400/20",    border: "border-cyan-400/20",  accent: "from-cyan-400/30" },
  } as const;

  const prefetchedRoutes = [
    "/bounty/new",
    ...bounties.flatMap((bounty) => [`/bounty/${bounty.id}`, `/bounty/${bounty.id}/insights`]),
  ];

  return (
    <>
      <RoutePrefetcher routes={prefetchedRoutes} />
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

      <div className="space-y-10 relative z-10">
        {/* ── Hero Header ── */}
        <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-white to-lime-200 bg-clip-text text-transparent pb-2 leading-normal">
              Campaign Dashboard
            </h1>
          </div>
        </section>

        {/* ── Stats Grid ── */}
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map(({ label, value, Icon, color }) => {
            const c = colorMap[color];
            return (
              <div
                key={label}
                className={`group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-xl transition-all duration-300 hover:border-white/15 hover:bg-white/[0.05] hover:-translate-y-0.5 hover:shadow-lg ${c.glow}`}
              >
                {/* Accent glow line at bottom */}
                <div className={`absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r ${c.accent} to-transparent opacity-0 transition-opacity group-hover:opacity-100`} />

                <div className="flex items-center justify-between mb-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${c.bg}`}>
                    <Icon className={`h-4 w-4 ${c.icon}`} />
                  </div>
                </div>
                <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.3em] text-stone-500">{label}</p>
              </div>
            );
          })}
        </section>

        {/* ── Controls: Search, Filter, Pagination ── */}
        <DashboardControls totalCount={0} totalPages={totalPages} currentPage={page} />

        {/* ── Bounty List ── */}
        <section>
          {bounties.length > 0 ? (
            <div className="grid gap-5">
              {bounties.map((bounty) => (
                <BountyCard key={bounty.id} bounty={bounty} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/[0.02] py-24 px-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 mb-5">
                <MessageSquareText className="h-7 w-7 text-stone-600" />
              </div>
              <p className="text-stone-500 text-center">No campaigns found matching your filters.</p>
              <Link
                href="/dashboard"
                className="mt-5 rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm text-lime-300 transition hover:bg-white/10"
              >
                Clear all filters
              </Link>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
