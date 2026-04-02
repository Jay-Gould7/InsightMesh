import Link from "next/link";

import { StatusPill } from "@/components/status-pill";
import { formatDate, formatTokenAmount, truncateAddress } from "@/lib/utils";

export function BountyCard({ bounty }: { bounty: any }) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.24)] backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-lime-300/70">Feedback bounty</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">{bounty.title}</h3>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-300">{bounty.description}</p>
        </div>
        <StatusPill status={bounty.status} />
      </div>
      <div className="mt-6 grid gap-4 text-sm text-stone-300 md:grid-cols-5">
        <div><p className="text-xs uppercase tracking-[0.3em] text-stone-500">Reward</p><p className="mt-2 text-lg font-medium text-white">{formatTokenAmount(bounty.rewardAmount)} USDT0</p></div>
        <div><p className="text-xs uppercase tracking-[0.3em] text-stone-500">Deadline</p><p className="mt-2 text-lg font-medium text-white">{formatDate(bounty.deadline)}</p></div>
        <div><p className="text-xs uppercase tracking-[0.3em] text-stone-500">Published</p><p className="mt-2 text-lg font-medium text-white">{formatDate(bounty.createdAt)}</p></div>
        <div><p className="text-xs uppercase tracking-[0.3em] text-stone-500">Responses</p><p className="mt-2 text-lg font-medium text-white">{bounty.submissions?.length ?? 0}</p></div>
        <div><p className="text-xs uppercase tracking-[0.3em] text-stone-500">Creator</p><p className="mt-2 text-lg font-medium text-white">{truncateAddress(bounty.creatorEspaceAddress ?? bounty.creatorCoreAddress)}</p></div>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href={`/bounty/${bounty.id}`} className="rounded-full bg-lime-300 px-4 py-2 text-sm font-semibold text-stone-900 transition hover:bg-lime-200">Open bounty</Link>
        <Link href={`/bounty/${bounty.id}/insights`} className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/90">Insights</Link>
      </div>
    </article>
  );
}
