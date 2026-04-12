"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, X } from "lucide-react";

import BorderGlow from "@/components/reactbits/BorderGlow";
import { INSIGHTS_MODAL_VISIBILITY_EVENT } from "@/lib/insights-modal";
import type { AnalysisCluster } from "@/lib/types";

function stopWheelPropagation(event: React.WheelEvent<HTMLElement>) {
  event.stopPropagation();
  const nativeEvent = event.nativeEvent as WheelEvent & {
    stopImmediatePropagation?: () => void;
  };
  nativeEvent.stopImmediatePropagation?.();
}

function ClusterOverviewModal({
  clusters,
  open,
  onClose,
}: {
  clusters: AnalysisCluster[];
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open || typeof document === "undefined") {
      return;
    }

    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    window.dispatchEvent(
      new CustomEvent(INSIGHTS_MODAL_VISIBILITY_EVENT, {
        detail: { open: true },
      }),
    );

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
      window.dispatchEvent(
        new CustomEvent(INSIGHTS_MODAL_VISIBILITY_EVENT, {
          detail: { open: false },
        }),
      );
    };
  }, [onClose, open]);

  return (
    <AnimatePresence>
      {open && clusters.length > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[130] flex items-center justify-center bg-[rgba(3,6,5,0.74)] px-4 pb-6 pt-14 backdrop-blur-xl sm:pt-20"
          onClick={onClose}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(66,210,147,0.14),transparent_34%),radial-gradient(circle_at_bottom,rgba(255,209,102,0.08),transparent_24%)]" />

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.985 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-3xl"
            data-insights-modal-root="true"
            onClick={(event) => event.stopPropagation()}
            onWheel={stopWheelPropagation}
          >
            <BorderGlow
              edgeSensitivity={30}
              glowColor="150 80 60"
              backgroundColor="#08140f"
              borderRadius={34}
              glowRadius={40}
              glowIntensity={0.95}
              coneSpread={25}
              animated={false}
              colors={["#42D293", "#34d399", "#fbbf24"]}
              className="w-full"
            >
              <div className="relative flex max-h-[min(80vh,720px)] w-full flex-col overflow-hidden rounded-[2.15rem] bg-[linear-gradient(180deg,rgba(8,20,15,0.97),rgba(7,10,8,0.985))] overscroll-contain">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(66,210,147,0.12),transparent_26%),radial-gradient(circle_at_left,rgba(255,209,102,0.05),transparent_22%)]" />
                <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#42D293]/45 to-transparent" />

                <div className="relative flex items-start justify-between gap-6 border-b border-white/8 bg-black/[0.16] px-6 py-5 backdrop-blur-xl sm:px-7">
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-[0.32em] text-stone-500">Cluster overview</p>
                    <h3 className="mt-2 text-2xl font-semibold text-white">What the crowd is converging on</h3>
                    <p className="mt-3 text-xs text-stone-500">
                      {clusters.length} {clusters.length === 1 ? "theme" : "themes"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    className="group relative z-10 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-stone-400 transition-all duration-300 hover:border-white/18 hover:bg-white/[0.08] hover:text-white hover:shadow-[0_10px_28px_rgba(0,0,0,0.22)]"
                    aria-label="Close cluster details"
                  >
                    <X className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90" />
                  </button>
                </div>

                <div
                  className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-7 pt-6 [scrollbar-gutter:stable] sm:px-7 sm:pb-8"
                  data-insights-modal-scroll="true"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.26, delay: 0.03, ease: [0.22, 1, 0.36, 1] }}
                    className="space-y-0"
                  >
                    {clusters.map((cluster) => (
                      <div
                        key={cluster.id}
                        className="border-b border-white/8 py-5 last:border-b-0 last:pb-0 first:pt-0"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <h4 className="text-lg font-semibold text-white">{cluster.theme}</h4>
                          <span className="shrink-0 text-xs text-stone-500">{cluster.count} responses</span>
                        </div>
                        <p className="mt-4 text-sm leading-7 text-stone-300">{cluster.summary}</p>
                      </div>
                    ))}
                  </motion.div>
                </div>
              </div>
            </BorderGlow>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function ClusterChart({ clusters }: { clusters: AnalysisCluster[] }) {
  const [overviewOpen, setOverviewOpen] = useState(false);
  const featuredCluster = clusters[0] ?? null;

  return (
    <>
      <section className="space-y-3">
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-white">What the crowd is converging on</h3>
        </div>
        {featuredCluster ? (
          <button
            type="button"
            onClick={() => setOverviewOpen(true)}
            className="group block w-full border-b border-white/10 py-3 text-left transition-colors duration-300 hover:border-white/20"
          >
            <div className="mb-2 flex items-center justify-between gap-4 text-sm text-stone-300">
              <span className="truncate text-base font-medium text-white">{featuredCluster.theme}</span>
              <span className="shrink-0">
                {clusters.length} {clusters.length === 1 ? "theme" : "themes"}
              </span>
            </div>
            <div className="h-px w-full bg-white/10 transition-colors duration-300 group-hover:bg-white/15" />
            <div className="mt-3 flex items-end justify-between gap-4">
              <p className="line-clamp-2 min-w-0 flex-1 text-sm leading-6 text-stone-400">
                {featuredCluster.summary}
              </p>
              <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-lime-300/85 transition-transform duration-300 group-hover:translate-x-0.5">
                Details
                <ChevronRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </button>
        ) : null}
      </section>

      <ClusterOverviewModal
        clusters={clusters}
        open={overviewOpen}
        onClose={() => setOverviewOpen(false)}
      />
    </>
  );
}
