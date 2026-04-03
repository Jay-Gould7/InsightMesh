"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Search, X, Plus } from "lucide-react";
import GlassSurface from "./reactbits/GlassSurface";
import PillNav from "./reactbits/PillNav";

import { BountyStatus } from "@prisma/client";

interface DashboardControlsProps {
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

export function DashboardControls({ totalCount, totalPages, currentPage }: DashboardControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const currentStatus = searchParams.get("status") || "ALL";

  // Debounce search update
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (searchQuery) {
        params.set("q", searchQuery);
      } else {
        params.delete("q");
      }
      params.set("page", "1");
      router.push(`${pathname}?${params.toString()}` as any);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery, pathname, router, searchParams]);

  const setStatus = (status: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (status === "ALL") {
      params.delete("status");
    } else {
      params.set("status", status);
    }
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}` as any);
  };

  const setPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`${pathname}?${params.toString()}` as any);
  };

  const statusOptions = [
    { label: "All", value: "ALL" },
    { label: "Active", value: BountyStatus.ACTIVE },
    { label: "Analyzing", value: BountyStatus.ANALYZING },
    { label: "Ready", value: BountyStatus.READY_TO_SETTLE },
    { label: "Settled", value: BountyStatus.SETTLED },
  ];

  // Map status options to items for PillNav
  const navItems = statusOptions.map((opt) => {
    const params = new URLSearchParams(searchParams.toString());
    if (opt.value === "ALL") {
      params.delete("status");
    } else {
      params.set("status", opt.value);
    }
    params.set("page", "1");
    const qs = params.toString();
    return {
      label: opt.label,
      href: qs ? `${pathname}?${qs}` : pathname,
    };
  });

  // Determine current active href for PillNav
  const activeParams = new URLSearchParams(searchParams.toString());
  activeParams.set("page", "1"); 
  const activeQs = activeParams.toString();
  const activeHref = activeQs ? `${pathname}?${activeQs}` : pathname;

  return (
    <div className="sticky top-16 z-30 -mx-6 px-6 py-4 transition-all duration-300">
      {/* Background Glass Surface Effect */}
      <div className="absolute inset-0 -z-10">
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

      {/* Search + Filter Row UI */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] py-2.5 pl-11 pr-10 text-sm text-white placeholder-stone-600 outline-none backdrop-blur-xl transition-all focus:border-lime-300/40 focus:bg-white/[0.05] focus:shadow-[0_0_20px_rgba(163,230,53,0.06)]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-stone-500 hover:text-white transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filter Tabs - Now using PillNav for high-end animation */}
        <PillNav
          logo=""
          items={navItems}
          activeHref={activeHref}
          bgColor="transparent"
          pillColor="rgba(255, 255, 255, 0.02)"
          hoverColor="#a3e635" 
          hoveredPillTextColor="#07130d"
          pillTextColor="rgba(255, 255, 255, 0.5)"
          className="scale-90 origin-left"
          initialLoadAnimation={false}
        />

        {/* Action Zone: Pagination & Launch Button - pushed to right */}
        <div className="flex items-center gap-4 md:ml-auto">
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-stone-600 font-mono tabular-nums">
                {currentPage}/{Math.max(1, totalPages)}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-1.5 text-stone-400 transition-all hover:bg-white/[0.08] hover:text-white disabled:opacity-25 disabled:pointer-events-none"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setPage(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-1.5 text-stone-400 transition-all hover:bg-white/[0.08] hover:text-white disabled:opacity-25 disabled:pointer-events-none"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          <Link
            href="/bounty/new"
            className="group flex items-center gap-2 rounded-full border border-lime-300/20 bg-lime-300/5 px-5 h-[40px] text-xs font-bold uppercase tracking-wider text-lime-300 backdrop-blur-xl transition-all hover:bg-lime-300/10 hover:border-lime-300/40 hover:shadow-[0_0_30px_rgba(163,230,53,0.1)]"
          >
            <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
            Launch Bounty
          </Link>
        </div>
      </div>
    </div>
  );
}
