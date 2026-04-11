import Link from "next/link";
import { ArrowUpRight, Plus } from "lucide-react";

import { BountyCard } from "@/components/bounty-card";
import FaultyTerminal from "@/components/reactbits/FaultyTerminal";
import Magnet from "@/components/reactbits/Magnet";
import { RoutePrefetcher } from "@/components/route-prefetcher";
import { listVisibleBounties } from "@/lib/db/queries";

export default async function HomePage() {
  const { bounties } = await listVisibleBounties({ pageSize: 5 });
  const prefetchedRoutes = [
    "/dashboard",
    "/bounty/new",
    ...bounties.flatMap((bounty) => [`/bounty/${bounty.id}`, `/bounty/${bounty.id}/insights`]),
  ];

  return (
    <div className="relative isolate">
      <RoutePrefetcher routes={prefetchedRoutes} />
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#060906]">
        <FaultyTerminal
          className="pointer-events-none h-full w-full opacity-[0.78]"
          scale={1.5}
          gridMul={[2, 1]}
          digitSize={1.2}
          timeScale={0.5}
          pause={false}
          scanlineIntensity={0.5}
          glitchAmount={1}
          flickerAmount={1}
          noiseAmp={1}
          chromaticAberration={0}
          dither={0}
          curvature={0.1}
          tint="#A7EF9E"
          mouseReact
          mouseStrength={0.5}
          pageLoadAnimation
          brightness={0.6}
        />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(167,239,158,0.12),transparent_24%),linear-gradient(180deg,rgba(4,10,6,0.1)_0%,rgba(4,10,6,0.48)_48%,rgba(4,10,6,0.88)_100%)]" />
      </div>

      <div className="relative z-10 space-y-10">
        <section className="grid min-h-[28rem] items-start gap-10 pt-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:pt-14">
          <div className="max-w-4xl">
            <h1 className="max-w-3xl text-5xl font-semibold leading-[1.02] text-white sm:text-6xl lg:text-[5rem]">
              Turn feedback into onchain rewards
            </h1>
            <p className="mt-8 max-w-3xl text-lg leading-9 text-stone-300 sm:text-[1.35rem]">
              InsightMesh lets creators lock a stablecoin bounty on eSpace, launch the campaign from Fluent on Core Space, collect gas-sponsored responses, and turn community insight into a native Conflux payout flow before the relayer distributes rewards.
            </p>
          </div>
          <div className="flex flex-col gap-8 pt-10 lg:items-end lg:pt-60">
            <Magnet padding={90} disabled={false} magnetStrength={14} wrapperClassName="w-fit" activeTransition="transform 0.18s ease-out" inactiveTransition="transform 0.35s ease-out">
              <Link
                href="/bounty/new"
                className="group relative inline-flex items-center overflow-hidden rounded-full border border-lime-200/60 bg-lime-300 px-7 py-3.5 text-base font-bold text-stone-950 shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_18px_50px_rgba(163,255,93,0.22)] transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.14),0_24px_70px_rgba(163,255,93,0.32)] active:scale-[0.985]"
              >
                <span className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.02)_0%,rgba(255,255,255,0.46)_22%,rgba(255,255,255,0.02)_42%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <span className="absolute inset-0 translate-x-[-130%] bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.55),transparent)] transition-transform duration-700 ease-out group-hover:translate-x-[130%]" />
                <span className="relative z-10 flex items-center gap-3">
                  <span className="transition-transform duration-300 group-hover:translate-x-0.5">Launch a bounty</span>
                  <Plus strokeWidth={2.6} className="h-4.5 w-4.5 transition-transform duration-300 group-hover:translate-x-1 group-hover:rotate-90" />
                </span>
              </Link>
            </Magnet>
            <Magnet padding={90} disabled={false} magnetStrength={14} wrapperClassName="w-fit" activeTransition="transform 0.18s ease-out" inactiveTransition="transform 0.35s ease-out">
              <Link
                href="/dashboard"
                className="group relative inline-flex items-center overflow-hidden rounded-full border border-white/15 bg-black/25 px-7 py-3.5 text-base font-bold text-white shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_18px_50px_rgba(0,0,0,0.24)] backdrop-blur-md transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.02] hover:border-white/25 hover:bg-black/38 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_24px_70px_rgba(0,0,0,0.38)] active:scale-[0.985]"
              >
                <span className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(167,239,158,0.14),transparent_58%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <span className="absolute inset-0 translate-x-[-130%] bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.14),transparent)] transition-transform duration-700 ease-out group-hover:translate-x-[130%]" />
                <span className="relative z-10 flex items-center gap-3">
                  <span className="transition-transform duration-300 group-hover:translate-x-0.5">View dashboard</span>
                  <ArrowUpRight strokeWidth={2.6} className="h-4.5 w-4.5 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-0.5" />
                </span>
              </Link>
            </Magnet>
          </div>
        </section>
        <section className="space-y-5">
          <div><p className="text-xs uppercase tracking-[0.35em] text-lime-300/70">Active bounties</p><h2 className="mt-2 text-3xl font-semibold text-white">Explore live feedback campaigns</h2></div>
          <div className="grid gap-6">
            {bounties.length === 0 ? <div className="rounded-3xl border border-dashed border-white/10 px-6 py-12 text-center text-stone-400">No live bounties yet. Launch the first InsightMesh campaign.</div> : bounties.map((bounty) => <BountyCard key={bounty.id} bounty={bounty} />)}
          </div>
        </section>
      </div>
    </div>
  );
}
