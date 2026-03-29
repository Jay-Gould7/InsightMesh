import Link from "next/link";

import { WalletHub } from "@/components/wallet-hub";
import { env } from "@/lib/env";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(153,255,126,0.22),_transparent_28%),linear-gradient(180deg,_#07130d_0%,_#0d1b13_48%,_#071009_100%)] text-stone-100">
      <header className="border-b border-white/8 bg-black/20 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-lime-300/70">Conflux Build Track</p>
            <Link href="/" className="text-2xl font-semibold tracking-tight text-white">{env.appName}</Link>
          </div>
          <div className="flex flex-col gap-3 lg:items-end">
            <nav className="flex items-center gap-5 text-sm text-stone-300">
              <Link href="/">Explore</Link>
              <Link href="/bounty/new">Launch</Link>
              <Link href="/dashboard">Dashboard</Link>
            </nav>
            <WalletHub coreNetworkId={env.coreNetworkId} eSpaceChainId={env.eSpaceChainId} />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
