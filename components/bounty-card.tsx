"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Clock, Coins, Users, ArrowUpRight, BarChart3, Calendar } from "lucide-react";

import { StatusPill } from "@/components/status-pill";
import { formatDate, formatTokenAmount, truncateAddress } from "@/lib/utils";

export function BountyCard({ bounty }: { bounty: any }) {
  const router = useRouter();
  const detailHref = `/bounty/${bounty.id}` as Route;
  const insightsHref = `/bounty/${bounty.id}/insights` as Route;
  const actionButtonBaseClass =
    "relative inline-flex h-[38px] w-[136px] items-center justify-center overflow-hidden rounded-full px-4 text-[15px] font-semibold outline-none transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] active:translate-y-0 active:scale-[0.985] focus-visible:ring-2";

  useEffect(() => {
    router.prefetch(detailHref);
    router.prefetch(insightsHref);
  }, [detailHref, insightsHref, router]);

  return (
    <div
      onClick={() => router.push(detailHref)}
      onMouseEnter={() => {
        router.prefetch(detailHref);
        router.prefetch(insightsHref);
      }}
      onFocus={() => {
        router.prefetch(detailHref);
        router.prefetch(insightsHref);
      }}
      className="group block cursor-pointer"
    >
      <article className="relative rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl transition-all duration-300 group-hover:border-white/[0.14] group-hover:bg-white/[0.05] group-hover:shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
        {/* Hover glow accent */}
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-lime-300/[0.06] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none" />

        <div className="relative p-6">
          <div className="flex items-start justify-between gap-6">
            {/* Left: ID inline with title */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-white leading-snug truncate">{bounty.title}</h3>
              <p className="mt-1.5 text-sm text-stone-400 leading-relaxed line-clamp-2">{bounty.description}</p>
            </div>

            {/* Right: Swap zone — top-aligned with title */}
            <div className="relative h-[82px] min-w-[152px] shrink-0">
              {/* Default: Status + Reward */}
              <div className="absolute inset-0 flex flex-col items-end gap-2 transition-opacity duration-200 group-hover:opacity-0 group-hover:pointer-events-none">
                <StatusPill status={bounty.status} />
                <div className="flex items-center gap-1.5 rounded-xl bg-lime-300/10 border border-lime-300/20 px-3 py-1.5">
                  <Coins className="h-3.5 w-3.5 text-lime-300" />
                  <span className="text-sm font-bold text-lime-300 tabular-nums">{formatTokenAmount(bounty.rewardAmount)}</span>
                  <span className="text-[10px] text-lime-300/60 font-medium">USDT0</span>
                </div>
              </div>

              {/* Hover: Action buttons — interaction pattern aligned with creator-links */}
              <div className="absolute inset-0 flex flex-col items-end gap-2 opacity-0 pointer-events-none transition-opacity duration-200 group-hover:opacity-100 group-hover:pointer-events-auto">
                <Link
                  href={detailHref}
                  prefetch
                  onClick={(e) => e.stopPropagation()}
                  className={`group/open ${actionButtonBaseClass} border border-lime-200/35 bg-lime-300 text-[#09120b] shadow-[0_12px_26px_rgba(163,230,53,0.18),inset_0_1px_0_rgba(255,255,255,0.22)] hover:-translate-y-0.5 hover:border-lime-100/55 hover:bg-[#d8ff68] hover:shadow-[0_18px_34px_rgba(163,230,53,0.26),0_0_36px_rgba(163,230,53,0.18),inset_0_1px_0_rgba(255,255,255,0.3)] focus-visible:ring-lime-300/55`}
                >
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_left,rgba(255,255,255,0.32),transparent_55%)] opacity-0 transition-opacity duration-300 group-hover/open:opacity-100"
                  />
                  <span
                    aria-hidden
                    className="pointer-events-none absolute left-[16px] top-1/2 z-10 flex h-4 w-4 -translate-y-1/2 -translate-x-2 scale-75 items-center justify-center text-[#09120b] opacity-0 transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover/open:translate-x-0 group-hover/open:scale-100 group-hover/open:opacity-100"
                  >
                    <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover/open:translate-x-0.5 group-hover/open:-translate-y-0.5 group-hover/open:scale-110" />
                  </span>
                  <span className="relative z-10 transition-transform duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover/open:translate-x-3">
                    Open
                  </span>
                  <span
                    aria-hidden
                    className="relative z-10 ml-2 h-1.5 w-1.5 rounded-full bg-[#09120b]/80 transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover/open:ml-0 group-hover/open:w-0 group-hover/open:scale-0 group-hover/open:opacity-0"
                  />
                </Link>
                <Link
                  href={insightsHref}
                  prefetch
                  onClick={(e) => e.stopPropagation()}
                  className={`group/in ${actionButtonBaseClass} border border-white/10 bg-white/[0.035] text-stone-100 shadow-[0_8px_20px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.05)] hover:-translate-y-0.5 hover:border-lime-300/22 hover:bg-white/[0.055] hover:shadow-[0_14px_30px_rgba(0,0,0,0.16),inset_0_1px_0_rgba(255,255,255,0.08)] focus-visible:ring-lime-300/35`}
                >
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_left,rgba(163,230,53,0.14),transparent_55%)] opacity-0 transition-opacity duration-300 group-hover/in:opacity-100"
                  />
                  <span
                    aria-hidden
                    className="pointer-events-none absolute left-[16px] top-1/2 z-10 flex h-4 w-4 -translate-y-1/2 -translate-x-2 scale-75 items-center justify-center text-lime-300/95 opacity-0 transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover/in:translate-x-0 group-hover/in:scale-100 group-hover/in:opacity-100"
                  >
                    <BarChart3 className="h-4 w-4 transition-transform duration-300 group-hover/in:-rotate-6 group-hover/in:scale-110" />
                  </span>
                  <span className="relative z-10 transition-transform duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover/in:translate-x-3">
                    Insights
                  </span>
                </Link>
              </div>
            </div>
          </div>

          {/* Meta Row */}
          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-stone-500">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              <span>Deadline: <span className="text-stone-400">{formatDate(bounty.deadline)}</span></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3 w-3" />
              <span>Published: <span className="text-stone-400">{formatDate(bounty.createdAt)}</span></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="h-3 w-3" />
              <span className="text-stone-400">{bounty.submissions?.length ?? 0} responses</span>
            </div>
            <div className="font-mono text-stone-600">
              {truncateAddress(bounty.creatorEspaceAddress ?? bounty.creatorCoreAddress)}
            </div>
          </div>

          {/* ID in bottom right */}
          <div className="absolute bottom-4 right-8 text-[10px] font-mono text-stone-600 pointer-events-none group-hover:text-stone-500 transition-colors">
            #{bounty.id}
          </div>
        </div>
      </article>
    </div>
  );
}
