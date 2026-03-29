import Link from "next/link";

import { BountyCard } from "@/components/bounty-card";
import { listVisibleBounties } from "@/lib/db/queries";

export default async function HomePage() {
  const bounties = await listVisibleBounties();

  return (
    <div className="space-y-10">
      <section className="grid gap-8 rounded-[2rem] border border-lime-300/20 bg-black/20 p-8 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <p className="text-xs uppercase tracking-[0.45em] text-lime-300/70">AI-native Conflux protocol</p>
          <h1 className="mt-4 max-w-3xl text-5xl font-semibold leading-[1.05] text-white">Turn community feedback into an onchain contribution market.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-300">InsightMesh lets the creator lock a stablecoin bounty on eSpace, publish the campaign from Fluent on Core Space, collect gas-sponsored responses, and confirm a payout snapshot before the relayer distributes rewards.</p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/bounty/new" className="rounded-full bg-lime-300 px-6 py-3 text-sm font-semibold text-stone-900">Launch a bounty</Link>
            <Link href="/dashboard" className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white">View dashboard</Link>
          </div>
        </div>
        <div className="grid gap-4 text-sm text-stone-300">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5"><p className="text-xs uppercase tracking-[0.35em] text-lime-300/70">Gas sponsorship</p><p className="mt-3 text-xl font-semibold text-white">Submit once, zero gas friction</p><p className="mt-2 leading-7">Each Core address contributes one response and binds a payout address for settlement.</p></div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5"><p className="text-xs uppercase tracking-[0.35em] text-cyan-300/70">Dual-space flow</p><p className="mt-3 text-xl font-semibold text-white">Core for feedback, eSpace for money</p><p className="mt-2 leading-7">The product story stays native to Conflux instead of feeling like a generic EVM app.</p></div>
        </div>
      </section>
      <section className="space-y-5">
        <div><p className="text-xs uppercase tracking-[0.35em] text-lime-300/70">Active bounties</p><h2 className="mt-2 text-3xl font-semibold text-white">Explore live feedback campaigns</h2></div>
        <div className="grid gap-6">
          {bounties.length === 0 ? <div className="rounded-3xl border border-dashed border-white/10 px-6 py-12 text-center text-stone-400">No live bounties yet. Launch the first InsightMesh campaign.</div> : bounties.map((bounty) => <BountyCard key={bounty.id} bounty={bounty} />)}
        </div>
      </section>
    </div>
  );
}
