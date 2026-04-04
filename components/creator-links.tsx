"use client";

import Link from "next/link";
import { BarChart3, Coins } from "lucide-react";

import { useFluentWallet } from "@/components/providers/fluent-provider";

type CreatorLinksProps = {
  bountyId: number;
  creatorCoreAddress: string;
};

export function CreatorLinks({ bountyId, creatorCoreAddress }: CreatorLinksProps) {
  const { address } = useFluentWallet();
  const isCreator = address && address.toLowerCase() === creatorCoreAddress.toLowerCase();

  if (!isCreator) return null;

  const creatorLinkClass =
    "group relative inline-flex h-[36px] w-[148px] items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/[0.035] px-4 text-[16px] font-semibold text-stone-100 shadow-[0_8px_20px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.05)] outline-none transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] hover:-translate-y-0.5 hover:border-lime-300/22 hover:bg-white/[0.055] hover:shadow-[0_14px_30px_rgba(0,0,0,0.16),inset_0_1px_0_rgba(255,255,255,0.08)] active:translate-y-0 active:scale-[0.985] focus-visible:ring-2 focus-visible:ring-lime-300/35";

  return (
    <div className="flex flex-wrap items-center justify-end gap-3 shrink-0">
      <Link
        href={`/bounty/${bountyId}/insights`}
        className={creatorLinkClass}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute left-[16px] top-1/2 z-10 flex h-4 w-4 -translate-y-1/2 -translate-x-2 scale-75 items-center justify-center text-lime-300/95 opacity-0 transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:translate-x-0 group-hover:scale-100 group-hover:opacity-100"
        >
          <BarChart3 className="h-4 w-4 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110" />
        </span>
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_left,rgba(163,230,53,0.14),transparent_55%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />
        <span className="relative z-10 transition-transform duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:translate-x-3">Insights</span>
      </Link>
      <Link
        href={`/bounty/${bountyId}/settle`}
        className={creatorLinkClass}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute left-[16px] top-1/2 z-10 flex h-4 w-4 -translate-y-1/2 -translate-x-2 scale-75 items-center justify-center text-lime-300/95 opacity-0 transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:translate-x-0 group-hover:scale-100 group-hover:opacity-100"
        >
          <Coins className="h-4 w-4 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110" />
        </span>
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_left,rgba(163,230,53,0.14),transparent_55%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />
        <span className="relative z-10 transition-transform duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:translate-x-3">Settlement</span>
      </Link>
    </div>
  );
}
