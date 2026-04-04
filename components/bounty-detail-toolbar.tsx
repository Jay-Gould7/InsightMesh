"use client";

import LazyPillNav from "@/components/reactbits/LazyPillNav";
import GlassSurface from "@/components/reactbits/GlassSurface";
import { BackButton } from "@/components/back-button";
import { CreatorLinks } from "@/components/creator-links";

type BountyDetailToolbarProps = {
  bountyId: number;
  activeTab: string;
  creatorCoreAddress: string;
};

export function BountyDetailToolbar({
  bountyId,
  activeTab,
  creatorCoreAddress,
}: BountyDetailToolbarProps) {
  const navItems = [
    { label: "Respond", href: `/bounty/${bountyId}?tab=respond` },
    { label: "Submissions", href: `/bounty/${bountyId}?tab=submissions` },
  ];

  const activeHref = `/bounty/${bountyId}?tab=${activeTab}`;

  return (
    <div className="sticky top-16 z-40 -mx-6 px-6 py-4 transition-all duration-300">
      <div className="absolute inset-0 -z-10 px-6 py-4">
        <GlassSurface
          width="100%"
          height="100%"
          borderRadius={50}
          displace={0.5}
          distortionScale={-180}
          redOffset={0}
          greenOffset={10}
          blueOffset={20}
          brightness={50}
          opacity={0.93}
          mixBlendMode="screen"
        />
      </div>

      <div className="relative px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <div className="flex flex-wrap items-center gap-4">
            <BackButton />
            <div className="flex items-center">
              <LazyPillNav
                logo=""
                items={navItems}
                activeHref={activeHref}
                bgColor="rgba(255, 255, 255, 0.02)"
                baseColor="rgba(255, 255, 255, 0.5)"
                pillColor="rgba(255, 255, 255, 0.05)"
                hoverColor="#a3e635"
                hoveredPillTextColor="#07130d"
                pillTextColor="rgba(255, 255, 255, 0.7)"
                className="scale-90 origin-left"
                initialLoadAnimation={false}
              />
            </div>
          </div>
          <CreatorLinks bountyId={bountyId} creatorCoreAddress={creatorCoreAddress} />
        </div>
      </div>
    </div>
  );
}
