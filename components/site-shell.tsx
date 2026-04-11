import Link from "next/link";

import { InsightMeshMark } from "./insightmesh-mark";
import LazyShuffle from "./reactbits/LazyShuffle";
import GooeyNav from "./reactbits/GooeyNav";
import { WalletHub } from "@/components/wallet-hub";
import { env } from "@/lib/env";
import { Press_Start_2P } from "next/font/google";

const pressStart2P = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
});

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(153,255,126,0.22),_transparent_28%),linear-gradient(180deg,_#07130d_0%,_#0d1b13_48%,_#071009_100%)] text-stone-100">
      <header className="fixed top-0 w-full z-50 h-16 bg-[#0A0A0A]/80 backdrop-blur-md border-b border-white/10">
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 text-white font-bold text-xl tracking-wide">
            <InsightMeshMark className="h-7 w-7 shrink-0" />
            <LazyShuffle
              text="InsightMesh"
              className={`${pressStart2P.className} text-[20px] mt-1 normal-case tracking-normal`}
              shuffleDirection="down"
              duration={0.35}
              animationMode="evenodd"
              shuffleTimes={1}
              ease="power3.out"
              stagger={0.03}
              threshold={0.1}
              triggerOnce={true}
              triggerOnHover
              respectReducedMotion={true}
              loop={false}
              loopDelay={0}
            />
          </Link>
          <div className="flex items-center gap-6">
            <GooeyNav
              items={[
                { label: "Explore", href: "/" },
                { label: "Launch", href: "/bounty/new" },
                { label: "Dashboard", href: "/dashboard" },
              ]}
              initialActiveIndex={0}
            />
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
