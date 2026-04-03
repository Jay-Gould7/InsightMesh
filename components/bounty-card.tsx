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

              {/* Hover: Action buttons */}
              <div className="absolute inset-0 flex flex-col items-end gap-2 opacity-0 pointer-events-none transition-opacity duration-200 group-hover:opacity-100 group-hover:pointer-events-auto">
                <span className="flex items-center gap-1.5 rounded-xl bg-lime-300/15 border border-lime-300/25 px-4 py-2 text-xs font-semibold text-lime-300 transition-colors hover:bg-lime-300/25">
                  Open
                  <ArrowUpRight className="h-3 w-3" />
                </span>
                <Link
                  href={`/bounty/${bounty.id}/insights`}
                  onClick={(e) => e.stopPropagation()}
                  className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-xs font-medium text-stone-400 transition-all hover:border-white/15 hover:text-white hover:bg-white/[0.06]"
                >
                  Insights
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
