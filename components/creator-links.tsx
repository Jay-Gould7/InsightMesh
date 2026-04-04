"use client";

import Link from "next/link";

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
    "group relative inline-flex min-h-[40px] items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-sm font-medium text-stone-200 shadow-sm outline-none transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] hover:-translate-y-0.5 hover:scale-[1.03] hover:border-lime-300/45 hover:bg-lime-300/[0.08] hover:text-white hover:shadow-[0_0_32px_rgba(163,230,53,0.22)] active:translate-y-0 active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-lime-300/45";

  return (
    <div className="flex flex-wrap items-center justify-end gap-3 shrink-0">
      <Link href={`/bounty/${bountyId}/insights`} className={creatorLinkClass}>
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-lime-300/25 to-transparent opacity-0 transition duration-500 ease-out group-hover:translate-x-full group-hover:opacity-100"
        />
        <span className="relative z-10">Insights</span>
      </Link>
      <Link href={`/bounty/${bountyId}/settle`} className={creatorLinkClass}>
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-lime-300/25 to-transparent opacity-0 transition duration-500 ease-out group-hover:translate-x-full group-hover:opacity-100"
        />
        <span className="relative z-10">Settlement</span>
      </Link>
    </div>
  );
}
