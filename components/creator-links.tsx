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

  return (
    <div className="mt-6 flex flex-wrap gap-3">
      <Link href={`/bounty/${bountyId}/insights`} className="rounded-full border border-white/15 px-4 py-2 text-sm text-white">Open insights</Link>
      <Link href={`/bounty/${bountyId}/settle`} className="rounded-full border border-white/15 px-4 py-2 text-sm text-white">Settlement</Link>
    </div>
  );
}
