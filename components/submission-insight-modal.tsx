"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

import BorderGlow from "@/components/reactbits/BorderGlow";
import { SubmissionDetailContent, type SubmissionDetailRecord } from "@/components/submission-detail-content";
import { INSIGHTS_MODAL_VISIBILITY_EVENT } from "@/lib/insights-modal";
import type { SurveyQuestion } from "@/lib/types";
import { formatDate } from "@/lib/utils";

function stopWheelPropagation(event: React.WheelEvent<HTMLElement>) {
  event.stopPropagation();
  const nativeEvent = event.nativeEvent as WheelEvent & {
    stopImmediatePropagation?: () => void;
  };
  nativeEvent.stopImmediatePropagation?.();
}

export function SubmissionInsightModal({
  open,
  submission,
  questions,
  onClose,
}: {
  open: boolean;
  submission: SubmissionDetailRecord | null;
  questions: SurveyQuestion[];
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
      {open && submission ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[130] flex items-center justify-center bg-[rgba(3,6,5,0.74)] px-4 pb-6 pt-14 backdrop-blur-xl sm:pt-20"
          onClick={onClose}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(66,210,147,0.14),transparent_34%),radial-gradient(circle_at_bottom,rgba(255,209,102,0.08),transparent_24%)]" />

          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.965 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.985 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-4xl"
            data-insights-modal-root="true"
            onClick={(event) => event.stopPropagation()}
            onWheel={stopWheelPropagation}
          >
            <BorderGlow
              edgeSensitivity={30}
              glowColor="150 80 60"
              backgroundColor="#0a1812"
              borderRadius={36}
              glowRadius={40}
              glowIntensity={0.95}
              coneSpread={25}
              animated={false}
              colors={["#42D293", "#34d399", "#fbbf24"]}
              className="w-full"
            >
              <div className="relative flex max-h-[min(82vh,760px)] w-full flex-col overflow-hidden rounded-[2.25rem] bg-[linear-gradient(180deg,rgba(10,24,18,0.97),rgba(7,10,8,0.98))] overscroll-contain">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(66,210,147,0.13),transparent_26%),radial-gradient(circle_at_left,rgba(255,209,102,0.06),transparent_22%)]" />
                <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#42D293]/45 to-transparent" />

                <div className="relative flex items-start justify-between gap-6 border-b border-white/8 bg-black/[0.16] px-6 py-5 backdrop-blur-xl sm:px-7">
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-[0.32em] text-stone-500">
                      Response #{submission.id}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500">
                      <span>
                        {Object.keys(submission.answers).length} answer
                        {Object.keys(submission.answers).length === 1 ? "" : "s"}
                      </span>
                      {submission.createdAt ? (
                        <>
                          <span className="h-1 w-1 rounded-full bg-stone-600/80" />
                          <span>{formatDate(submission.createdAt)}</span>
                        </>
                      ) : null}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    className="group relative z-10 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-stone-400 transition-all duration-300 hover:border-white/18 hover:bg-white/[0.08] hover:text-white hover:shadow-[0_10px_28px_rgba(0,0,0,0.22)]"
                    aria-label="Close submission details"
                  >
                    <X className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90" />
                  </button>
                </div>

                <div
                  className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-7 pt-6 [scrollbar-gutter:stable] sm:px-7 sm:pb-8"
                  data-insights-modal-scroll="true"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.28, delay: 0.04, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <SubmissionDetailContent submission={submission} questions={questions} />
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
