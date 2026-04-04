"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock, Coins, Users, ArrowUpRight, Calendar } from "lucide-react";

import { StatusPill } from "@/components/status-pill";
import { formatDate, formatTokenAmount, truncateAddress } from "@/lib/utils";

export function BountyCard({ bounty }: { bounty: any }) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/bounty/${bounty.id}`)}
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
            <div className="shrink-0 relative min-w-[170px] h-[64px]">
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
                  href={`/bounty/${bounty.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="group/open relative inline-flex min-h-[36px] items-center justify-center gap-1.5 overflow-hidden rounded-xl bg-lime-300 px-4 py-2 text-xs font-semibold text-black shadow-[0_0_20px_rgba(163,230,53,0.22)] outline-none transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] hover:-translate-y-0.5 hover:scale-[1.03] hover:bg-lime-200 hover:shadow-[0_0_36px_rgba(163,230,53,0.45)] active:translate-y-0 active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-lime-300/70"
                >
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 transition duration-500 ease-out group-hover/open:translate-x-full group-hover/open:opacity-100"
                  />
                  <span className="relative z-10 flex items-center gap-1.5">
                    Open
                    <ArrowUpRight className="h-3 w-3 transition-transform duration-300 group-hover/open:translate-x-0.5 group-hover/open:-translate-y-0.5" />
                  </span>
                </Link>
                <Link
                  href={`/bounty/${bounty.id}/insights`}
                  onClick={(e) => e.stopPropagation()}
                  className="group/in relative inline-flex min-h-[36px] items-center justify-center overflow-hidden rounded-xl border border-white/[0.12] bg-white/[0.04] px-4 py-2 text-xs font-medium text-stone-200 shadow-sm outline-none transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] hover:-translate-y-0.5 hover:scale-[1.03] hover:border-lime-300/40 hover:bg-lime-300/[0.08] hover:text-white hover:shadow-[0_0_28px_rgba(163,230,53,0.18)] active:translate-y-0 active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-lime-300/40"
                >
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-lime-300/25 to-transparent opacity-0 transition duration-500 ease-out group-hover/in:translate-x-full group-hover/in:opacity-100"
                  />
                  <span className="relative z-10">Insights</span>
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
