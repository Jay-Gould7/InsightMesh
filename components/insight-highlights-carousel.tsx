"use client";

import type { PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, Star, X } from "lucide-react";

import BorderGlow from "@/components/reactbits/BorderGlow";
import {
  SubmissionDetailContent,
  type SubmissionDetailRecord,
} from "@/components/submission-detail-content";
import { INSIGHTS_MODAL_VISIBILITY_EVENT } from "@/lib/insights-modal";
import type { SurveyQuestion } from "@/lib/types";
import type { InsightHighlight } from "@/lib/types";

const CARD_GAP = 24;

function getVisibleCount(width: number) {
  if (width >= 1180) {
    return 3;
  }

  if (width >= 820) {
    return 2;
  }

  return 1;
}

function getCardWidth(viewportWidth: number, visibleCount: number) {
  if (viewportWidth <= 0) {
    return 0;
  }

  const ideal = (viewportWidth - CARD_GAP * (visibleCount - 1)) / visibleCount;

  if (visibleCount === 3) {
    return Math.min(ideal, 420);
  }

  if (visibleCount === 2) {
    return Math.min(ideal, 340);
  }

  return ideal;
}

function getBonusLabel(highlight: InsightHighlight) {
  if (highlight.bonusPoints > 0) {
    return `+${highlight.bonusPoints} ${highlight.bonusType}`;
  }

  return "No bonus";
}

function isPrimaryPointer(event: ReactPointerEvent<HTMLDivElement>) {
  return event.isPrimary && event.button === 0;
}

function clampDragStep(distance: number, stride: number, visibleCount: number) {
  const raw = Math.round(distance / Math.max(stride, 1));
  return Math.min(Math.max(raw, 1), Math.max(visibleCount, 1));
}

function stopWheelPropagation(event: React.WheelEvent<HTMLElement>) {
  event.stopPropagation();
  const nativeEvent = event.nativeEvent as WheelEvent & {
    stopImmediatePropagation?: () => void;
  };
  nativeEvent.stopImmediatePropagation?.();
}

function HighlightDetailModal({
  highlight,
  submission,
  questions,
  open,
  onClose,
}: {
  highlight: InsightHighlight | null;
  submission: SubmissionDetailRecord | null;
  questions: SurveyQuestion[];
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
      {open && highlight ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[140] isolate flex items-center justify-center bg-[rgba(3,6,5,0.82)] px-4 pb-6 pt-16 sm:pt-24"
          style={{
            backdropFilter: "blur(28px)",
            WebkitBackdropFilter: "blur(28px)",
          }}
          onClick={onClose}
        >
          <div
            className="pointer-events-none absolute inset-0 bg-[rgba(3,6,5,0.26)] backdrop-blur-[28px]"
            style={{
              backdropFilter: "blur(28px)",
              WebkitBackdropFilter: "blur(28px)",
            }}
          />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(66,210,147,0.14),transparent_34%),radial-gradient(circle_at_bottom,rgba(255,214,102,0.08),transparent_24%)]" />

          <motion.div
            initial={{ opacity: 0, y: 26, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.985 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-2xl"
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
              coneSpread={24}
              animated={false}
              colors={["#42D293", "#34d399", "#fbbf24"]}
              className="w-full"
            >
              <div className="relative flex max-h-[min(78vh,720px)] flex-col overflow-hidden rounded-[2.125rem] bg-[linear-gradient(180deg,rgba(8,20,15,0.98),rgba(5,9,7,0.985))]">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(66,210,147,0.12),transparent_28%),radial-gradient(circle_at_left,rgba(255,214,102,0.08),transparent_24%)]" />
                <div className="relative flex items-start justify-between gap-4 border-b border-white/8 bg-black/[0.16] px-6 py-5 backdrop-blur-xl sm:px-7">
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-[0.32em] text-stone-500">
                      Highlighted submission #{highlight.submissionId}
                    </p>
                    <h3 className="mt-3 text-2xl font-semibold leading-tight text-white">{highlight.title}</h3>
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    className="group relative z-10 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-stone-400 transition-all duration-300 hover:border-white/18 hover:bg-white/[0.08] hover:text-white hover:shadow-[0_10px_28px_rgba(0,0,0,0.22)]"
                    aria-label="Close highlight details"
                  >
                    <X className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90" />
                  </button>
                </div>

                <div
                  className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-7 pt-6 [scrollbar-gutter:stable] sm:px-7 sm:pb-8"
                  data-insights-modal-scroll="true"
                >
                  <div className="space-y-6">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-lime-200/90">
                        <Sparkles className="h-3.5 w-3.5" />
                        {getBonusLabel(highlight)}
                      </div>
                      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-300">
                        {highlight.bonusType}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-[11px] uppercase tracking-[0.3em] text-stone-500">Full AI rationale</p>
                      <p className="text-base leading-8 text-stone-200">{highlight.reason}</p>
                    </div>

                    <div className="border-t border-white/8 pt-6">
                      <p className="text-[11px] uppercase tracking-[0.3em] text-stone-500">Submitted response details</p>
                      {submission ? (
                        <div className="mt-4">
                          <SubmissionDetailContent submission={submission} questions={questions} />
                        </div>
                      ) : (
                        <p className="mt-4 text-sm leading-7 text-stone-400">
                          No response details are available for this highlighted submission yet.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </BorderGlow>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

type HighlightSubmissionEntry = {
  submissionId: number;
  summary?: string;
  payoutAddress?: string;
  submitterCoreAddress?: string;
  submission?: {
    summary?: string;
    answers?: Record<string, unknown>;
    createdAt?: string;
    submitterCoreAddress?: string;
    payoutAddress?: string;
  } | null;
};

function wrapIndex(value: number, total: number) {
  return ((value % total) + total) % total;
}

export function InsightHighlightsCarousel({
  highlights,
  questions,
  entries,
}: {
  highlights: InsightHighlight[];
  questions: SurveyQuestion[];
  entries: HighlightSubmissionEntry[];
}) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const captureTargetRef = useRef<Element | null>(null);
  const dragStartXRef = useRef(0);
  const dragOffsetRef = useRef(0);
  const blockClickRef = useRef(false);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [transitionEnabled, setTransitionEnabled] = useState(true);
  const [slotOffset, setSlotOffset] = useState(0);
  const [selectedHighlight, setSelectedHighlight] = useState<InsightHighlight | null>(null);

  const visibleCount = useMemo(() => getVisibleCount(viewportWidth), [viewportWidth]);
  const loopEnabled = highlights.length > visibleCount && highlights.length > 1;
  const cardWidth = Math.max(getCardWidth(viewportWidth, visibleCount), 0);
  const stride = cardWidth > 0 ? cardWidth + CARD_GAP : 0;
  const effectiveOffset = stride > 0 ? slotOffset - dragOffset / stride : slotOffset;
  const renderSlots = useMemo(() => {
    if (highlights.length === 0) {
      return [];
    }

    if (!loopEnabled) {
      return highlights.map((_, index) => index);
    }

    const overscan = Math.max(4, visibleCount + 1);
    const start = Math.floor(effectiveOffset) - overscan;
    const end = Math.ceil(effectiveOffset) + visibleCount + overscan;

    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [effectiveOffset, highlights, loopEnabled, visibleCount]);
  const submissionMap = useMemo(
    () => new Map(entries.map((entry) => [entry.submissionId, entry])),
    [entries],
  );
  const selectedSubmission = useMemo<SubmissionDetailRecord | null>(() => {
    if (!selectedHighlight) {
      return null;
    }

    const entry = submissionMap.get(selectedHighlight.submissionId);
    if (!entry) {
      return null;
    }

    return {
      id: selectedHighlight.submissionId,
      summary: entry.submission?.summary ?? entry.summary ?? "",
      answers: entry.submission?.answers ?? {},
      submitterCoreAddress: entry.submission?.submitterCoreAddress ?? entry.submitterCoreAddress ?? "",
      payoutAddress: entry.submission?.payoutAddress ?? entry.payoutAddress ?? "",
      createdAt: entry.submission?.createdAt ?? "",
    };
  }, [selectedHighlight, submissionMap]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver((observedEntries) => {
      const width = observedEntries[0]?.contentRect.width ?? 0;
      setViewportWidth(width);
    });

    observer.observe(viewport);
    setViewportWidth(viewport.getBoundingClientRect().width);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setTransitionEnabled(false);
    setSlotOffset(0);
    setDragOffset(0);
    dragOffsetRef.current = 0;

    const frame = window.requestAnimationFrame(() => {
      setTransitionEnabled(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [highlights.length, loopEnabled]);

  function releasePointer(event: ReactPointerEvent<HTMLDivElement>) {
    if (pointerIdRef.current !== null && captureTargetRef.current?.hasPointerCapture?.(pointerIdRef.current)) {
      try {
        captureTargetRef.current.releasePointerCapture(pointerIdRef.current);
      } catch (e) {
        // Ignored
      }
    }
    pointerIdRef.current = null;
    captureTargetRef.current = null;
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!loopEnabled || !isPrimaryPointer(event)) {
      return;
    }

    pointerIdRef.current = event.pointerId;
    dragStartXRef.current = event.clientX;
    dragOffsetRef.current = 0;
    blockClickRef.current = false;
    setIsDragging(true);
    setTransitionEnabled(false);
    
    const target = event.target as Element;
    captureTargetRef.current = target;
    if (typeof target.setPointerCapture === "function") {
      target.setPointerCapture(event.pointerId);
    } else {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!isDragging || event.pointerId !== pointerIdRef.current) {
      return;
    }

    const nextOffset = event.clientX - dragStartXRef.current;
    dragOffsetRef.current = nextOffset;
    if (Math.abs(nextOffset) > 10) {
      blockClickRef.current = true;
    }
    setDragOffset(nextOffset);
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (!isDragging || event.pointerId !== pointerIdRef.current) {
      return;
    }

    releasePointer(event);
    setIsDragging(false);

    const distance = dragOffsetRef.current;
    const threshold = Math.max(cardWidth * 0.18, 42);
    setTransitionEnabled(true);

    if (Math.abs(distance) >= threshold && stride > 0) {
      const step = clampDragStep(Math.abs(distance), stride, visibleCount);
      const direction = distance < 0 ? 1 : -1;
      setSlotOffset((current) => current + direction * step);
    }

    setDragOffset(0);
    dragOffsetRef.current = 0;
  }

  function handlePointerCancel(event: ReactPointerEvent<HTMLDivElement>) {
    if (!isDragging || event.pointerId !== pointerIdRef.current) {
      return;
    }

    releasePointer(event);
    setIsDragging(false);
    setTransitionEnabled(true);
    setDragOffset(0);
    dragOffsetRef.current = 0;
  }

  if (highlights.length === 0) {
    return (
      <div className="rounded-[2rem] border border-dashed border-white/10 bg-white/[0.03] px-6 py-12 text-center backdrop-blur-xl">
        <p className="text-sm text-stone-400">No distilled highlights yet.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-lime-400/10">
            <Star className="h-5 w-5 text-lime-400" />
          </div>
          <h3 className="text-2xl font-semibold tracking-tight text-white">AI-Distilled Highlights</h3>
        </div>

        <div
          ref={viewportRef}
          className="relative overflow-hidden rounded-[2rem]"
          style={{ height: "11.5rem", touchAction: loopEnabled ? "pan-y" : "auto" }}
        >
          <div
            className={`relative h-full select-none ${loopEnabled ? "cursor-grab active:cursor-grabbing" : ""}`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            onPointerLeave={handlePointerCancel}
          >
            {renderSlots.map((slotIndex) => {
              const highlight = loopEnabled
                ? highlights[wrapIndex(slotIndex, highlights.length)]
                : highlights[slotIndex];
              if (!highlight) {
                return null;
              }

              const x = loopEnabled ? (slotIndex - slotOffset) * stride + dragOffset : slotIndex * stride;

              return (
              <button
                key={`${highlight.submissionId}-${highlight.title}-${slotIndex}`}
                type="button"
                className="group absolute top-0 overflow-hidden rounded-[1.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(8,12,10,0.9),rgba(6,9,7,0.98))] p-3.5 text-left backdrop-blur-md transition-colors duration-300 hover:border-lime-400/30"
                style={{
                  width: `${cardWidth}px`,
                  height: "11.5rem",
                  transform: `translate3d(${x}px,0,0)`,
                  transition: transitionEnabled ? "transform 520ms cubic-bezier(0.22, 1, 0.36, 1)" : "none",
                  willChange: "transform",
                }}
                onClick={() => {
                  if (blockClickRef.current) {
                    blockClickRef.current = false;
                    return;
                  }

                  setSelectedHighlight(highlight);
                }}
              >
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(66,210,147,0.1),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_42%)] opacity-70 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                <div className="relative z-10 flex h-full flex-col">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[9px] uppercase tracking-[0.22em] text-stone-500">
                        Submission #{highlight.submissionId}
                      </p>
                      <h4
                        className="mt-2.5 text-base font-semibold leading-snug text-white"
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {highlight.title}
                      </h4>
                    </div>

                    <div
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] ${
                        highlight.bonusPoints > 0
                          ? "bg-lime-400/12 text-lime-300"
                          : "border border-amber-300/18 bg-amber-300/10 text-amber-200"
                      }`}
                    >
                      {highlight.bonusPoints > 0 ? `+${highlight.bonusPoints}` : "No bonus"}
                    </div>
                  </div>

                  <div className="mt-3 h-px bg-white/8" />

                  <p
                    className="mt-3 text-[13px] leading-5 text-stone-300/92"
                    style={{
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {highlight.reason}
                  </p>

                  <div className="mt-auto pt-3 text-[11px] font-medium text-lime-300/88 transition-colors duration-300 group-hover:text-lime-200">
                    View full insight
                  </div>
                </div>
              </button>
              );
            })}
          </div>
        </div>
      </div>

      <HighlightDetailModal
        highlight={selectedHighlight}
        submission={selectedSubmission}
        questions={questions}
        open={selectedHighlight !== null}
        onClose={() => setSelectedHighlight(null)}
      />
    </>
  );
}
