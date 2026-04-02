"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

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
      params.set("page", "1"); // Reset to page 1 on search
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

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl md:flex-row md:items-center md:justify-between">
      {/* Search Input */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
        <input
          type="text"
          placeholder="Search campaigns..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-black/20 py-2 pl-10 pr-4 text-sm text-white placeholder-stone-500 outline-none focus:border-lime-300/50"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {statusOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setStatus(opt.value)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
              currentStatus === opt.value
                ? "bg-lime-300 text-stone-900"
                : "bg-white/5 text-stone-400 hover:bg-white/10 hover:text-white"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-stone-500">
          Page {currentPage} of {Math.max(1, totalPages)}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="rounded-full border border-white/10 bg-white/5 p-1.5 text-white transition hover:bg-white/10 disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="rounded-full border border-white/10 bg-white/5 p-1.5 text-white transition hover:bg-white/10 disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
