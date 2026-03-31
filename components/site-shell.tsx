import Link from "next/link";
import { Hexagon } from "lucide-react";

import { WalletHub } from "@/components/wallet-hub";
import { env } from "@/lib/env";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(153,255,126,0.22),_transparent_28%),linear-gradient(180deg,_#07130d_0%,_#0d1b13_48%,_#071009_100%)] text-stone-100">
      <header className="fixed top-0 w-full z-50 h-16 bg-[#0A0A0A]/80 backdrop-blur-md border-b border-white/10">
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 text-white font-bold text-xl tracking-wide">
            <Hexagon className="text-[#42D293] w-6 h-6" />
            InsightMesh
          </Link>
          <div className="flex items-center gap-6">
            <nav className="flex items-center gap-5 text-zinc-400 text-sm font-medium">
              <Link href="/" className="hover:text-white transition-colors">Explore</Link>
              <Link href="/bounty/new" className="hover:text-white transition-colors">Launch</Link>
              <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
            </nav>
            <div className="flex items-center">
              <WalletHub coreNetworkId={env.coreNetworkId} eSpaceChainId={env.eSpaceChainId} />
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 pt-24 pb-10">{children}</main>
    </div>
  );
}
