"use client";

import Link from "next/link";
import { type ReactNode } from "react";

import { useFluentWallet } from "@/components/providers/fluent-provider";

type CreatorGateProps = {
  creatorCoreAddress: string;
  bountyId: number;
  children: ReactNode;
};

export function CreatorGate({ creatorCoreAddress, bountyId, children }: CreatorGateProps) {
  const { address } = useFluentWallet();

  if (!address) {
    return (
      <div className="space-y-4 rounded-[2rem] border border-dashed border-white/10 px-6 py-16 text-center backdrop-blur-xl">
        <p className="text-lg font-medium text-white">Connect your Core wallet</p>
        <p className="text-sm text-stone-400">Only the bounty creator can access this page. Please connect Fluent Wallet to verify your identity.</p>
        <Link href={`/bounty/${bountyId}`} className="mt-4 inline-block rounded-full border border-white/15 px-4 py-2 text-sm text-white">Back to bounty</Link>
      </div>
    );
  }

  const isCreator = address.toLowerCase() === creatorCoreAddress.toLowerCase();

  if (!isCreator) {
    return (
      <div className="space-y-4 rounded-[2rem] border border-amber-300/15 bg-amber-300/5 px-6 py-16 text-center backdrop-blur-xl">
        <p className="text-lg font-medium text-amber-200">Access restricted</p>
        <p className="text-sm text-stone-400">This page is only available to the bounty creator.</p>
        <p className="mt-1 text-xs text-stone-500">Connected: {address}</p>
        <p className="text-xs text-stone-500">Creator: {creatorCoreAddress}</p>
        <Link href={`/bounty/${bountyId}`} className="mt-4 inline-block rounded-full border border-white/15 px-4 py-2 text-sm text-white">Back to bounty</Link>
      </div>
    );
  }

  return <>{children}</>;
}
