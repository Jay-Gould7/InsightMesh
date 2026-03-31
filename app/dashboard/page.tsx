import Link from "next/link";
import LightRays from "@/components/reactbits/LightRays";

import { BountyCard } from "@/components/bounty-card";
import { listVisibleBounties } from "@/lib/db/queries";

export default async function DashboardPage() {
  const bounties = await listVisibleBounties();
  const activeCount = bounties.filter((bounty) => bounty.status === "ACTIVE").length;
  const readyCount = bounties.filter((bounty) => bounty.status === "READY_TO_SETTLE").length;
  const settledCount = bounties.filter((bounty) => bounty.status === "SETTLED").length;
  const submissions = bounties.reduce((sum, bounty) => sum + bounty.submissions.length, 0);

  return (
    <>
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
      <div className="space-y-8 relative z-10">
        <section className="grid gap-4 md:grid-cols-4">
          {[
            ["Live bounties", activeCount],
            ["Ready to settle", readyCount],
            ["Settled", settledCount],
            ["Responses", submissions],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.35em] text-lime-300/70">{label}</p>
              <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
            </div>
          ))}
        </section>
        <section className="space-y-5">
          <div className="flex items-end justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.35em] text-lime-300/70">Database-backed overview</p><h1 className="mt-2 text-4xl font-semibold text-white">All campaigns in one place</h1></div><Link href="/bounty/new" className="rounded-full border border-white/15 px-4 py-2 text-sm text-white">Launch another bounty</Link></div>
          <div className="grid gap-6">{bounties.map((bounty) => <BountyCard key={bounty.id} bounty={bounty} />)}</div>
        </section>
      </div>
    </>
  );
}
