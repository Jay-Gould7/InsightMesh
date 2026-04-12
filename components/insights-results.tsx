"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AntiSybilPanel } from "@/components/anti-sybil-panel";
import { BackToBountyButton } from "@/components/back-to-bounty-button";
import { ClusterChart } from "@/components/cluster-chart";
import { HighRiskReviewPanel } from "@/components/high-risk-review-panel";
import { InsightHighlightsCarousel } from "@/components/insight-highlights-carousel";
import { InsightActions } from "@/components/insight-actions";
import { InsightsWaveOverlay } from "@/components/insights-wave-overlay";
import { ScoreTable } from "@/components/score-table";
import { SettlementPanel } from "@/components/settlement-panel";
import { INSIGHTS_MODAL_VISIBILITY_EVENT } from "@/lib/insights-modal";
import {
  INSIGHTS_MANUAL_BLOCK_EVENT,
  INSIGHTS_PREVIEW_EVENT,
  type InsightsPreviewPayload,
} from "@/lib/insights-preview";
import { buildPreviewScoreBreakdown } from "@/lib/score-breakdown";
import type {
  AnalysisCluster,
  DisqualifiedSubmission,
  InsightHighlight,
  ScoreBreakdownEntry,
  SurveyQuestion,
} from "@/lib/types";

type ScoreEntryLike = ScoreBreakdownEntry & {
  rank?: number | null;
  submission?: {
    payoutAddress?: string;
    summary?: string;
    answers?: Record<string, unknown>;
    createdAt?: string;
  } | null;
};

function findScrollableAncestor(start: EventTarget | null, boundary: HTMLElement | null) {
  let current = start instanceof HTMLElement ? start : null;

  while (current && current !== boundary) {
    const style = window.getComputedStyle(current);
    const overflowY = style.overflowY;
    const canScroll =
      (overflowY === "auto" || overflowY === "scroll") &&
      current.scrollHeight > current.clientHeight + 2;

    if (canScroll) {
      return current;
    }

    current = current.parentElement;
  }

  return null;
}

function findClosestAncestor(start: EventTarget | null, selector: string) {
  let current = start instanceof HTMLElement ? start : null;

  while (current) {
    if (current.matches(selector)) {
      return current;
    }

    current = current.parentElement;
  }

  return null;
}

function clampIndex(value: number, max: number) {
  return Math.min(Math.max(value, 0), max);
}

function buildDemoHighlights(entries: ScoreEntryLike[]): InsightHighlight[] {
  const demoTitles = [
    "示例卡片 · 性能优化建议被反复提及",
    "示例卡片 · 用户更偏好更直观的填写流程",
    "示例卡片 · 奖励分配透明度被视为关键体验",
  ];
  const demoReasons = [
    "用于预览轮播效果的临时高光卡片。这张卡片模拟了一条更偏系统层面的建议，文本故意稍长一点，方便一起观察标题截断、正文截断和点击展开详情后的完整阅读体验。",
    "用于预览轮播效果的第二张临时卡片。这张内容更偏产品交互，适合测试一排三张时的横向拖拽、循环切换，以及卡片大小压缩后的信息密度是否仍然舒服。",
    "用于预览轮播效果的第三张临时卡片。这张卡片偏结算与信任感表达，可以帮助你快速看清在三张以上时，轮播是否已经进入你想要的那种连续滑动感。",
  ];

  return demoTitles.map((title, index) => ({
    submissionId: entries[index % Math.max(entries.length, 1)]?.submissionId ?? 9000 + index,
    title,
    reason: demoReasons[index] ?? demoReasons[demoReasons.length - 1],
    bonusType: index === 0 ? "quality" : index === 1 ? "discovery" : "consensus",
    bonusPoints: index === 1 ? 2 : index === 2 ? 1 : 0,
  }));
}

export function InsightsResults({
  bountyId,
  title,
  status,
  analysisStatus,
  questions,
  creatorAddress,
  settled,
  settlementTx,
  initialClusters,
  initialHighlights,
  initialDisqualified,
  initialScoreBreakdown,
  scoreSnapshot,
}: {
  bountyId: number;
  title: string;
  status: string;
  analysisStatus: string;
  questions: SurveyQuestion[];
  creatorAddress: string;
  settled: boolean;
  settlementTx?: string | null;
  initialClusters: AnalysisCluster[];
  initialHighlights: InsightHighlight[];
  initialDisqualified: DisqualifiedSubmission[];
  initialScoreBreakdown: ScoreEntryLike[];
  scoreSnapshot:
    | {
        snapshotKey: string;
        entries: ScoreEntryLike[];
      }
    | null;
}) {
  const [preview, setPreview] = useState<InsightsPreviewPayload>(null);
  const [manualBlockedSubmissionIds, setManualBlockedSubmissionIds] = useState<number[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = useRef<Array<HTMLElement | null>>([]);
  const activeSectionRef = useRef(0);
  const snapLockRef = useRef<number | null>(null);
  const modalOpenRef = useRef(false);

  useEffect(() => {
    function handlePreview(event: Event) {
      const customEvent = event as CustomEvent<{ preview: InsightsPreviewPayload }>;
      setPreview(customEvent.detail?.preview ?? null);
      setManualBlockedSubmissionIds([]);
    }

    window.addEventListener(INSIGHTS_PREVIEW_EVENT, handlePreview as EventListener);
    return () => window.removeEventListener(INSIGHTS_PREVIEW_EVENT, handlePreview as EventListener);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.dispatchEvent(
      new CustomEvent(INSIGHTS_MANUAL_BLOCK_EVENT, {
        detail: { blockedSubmissionIds: manualBlockedSubmissionIds },
      }),
    );
  }, [manualBlockedSubmissionIds]);

  useEffect(() => {
    modalOpenRef.current = isModalOpen;
  }, [isModalOpen]);

  useEffect(() => {
    function handleModalVisibility(event: Event) {
      const customEvent = event as CustomEvent<{ open?: boolean }>;
      setIsModalOpen(Boolean(customEvent.detail?.open));
    }

    window.addEventListener(INSIGHTS_MODAL_VISIBILITY_EVENT, handleModalVisibility as EventListener);
    return () => window.removeEventListener(INSIGHTS_MODAL_VISIBILITY_EVENT, handleModalVisibility as EventListener);
  }, []);

  const clusters = preview?.clusters ?? initialClusters;
  const highlights = preview?.highlights ?? initialHighlights;
  const disqualified = preview?.disqualified ?? initialDisqualified;
  const scoreBreakdown = useMemo(() => {
    const source = preview?.scoreBreakdown ?? initialScoreBreakdown;
    if (!preview?.scoreBreakdown) {
      return source;
    }

    const initialEntryMap = new Map(initialScoreBreakdown.map((entry) => [entry.submissionId, entry]));
    return source.map((entry) => ({
      ...initialEntryMap.get(entry.submissionId),
      ...entry,
      submission: initialEntryMap.get(entry.submissionId)?.submission ?? null,
    }));
  }, [initialScoreBreakdown, preview?.scoreBreakdown]);
  const hasVisibleInsights = clusters.length > 0 || highlights.length > 0;
  const highRiskEntries = useMemo(
    () => scoreBreakdown.filter((entry) => entry.sybilRiskLevel === "high"),
    [scoreBreakdown],
  );
  const estimatedEntries = useMemo(
    () => buildPreviewScoreBreakdown(scoreBreakdown, manualBlockedSubmissionIds),
    [manualBlockedSubmissionIds, scoreBreakdown],
  );

  useEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }
    const rootElement = root;

    function syncActiveSection() {
      const height = rootElement.clientHeight || 1;
      activeSectionRef.current = clampIndex(
        Math.round(rootElement.scrollTop / height),
        sectionRefs.current.length - 1,
      );
    }

    function handleWheel(event: WheelEvent) {
      if (modalOpenRef.current) {
        const modalRoot = findClosestAncestor(event.target, '[data-insights-modal-root="true"]');
        if (modalRoot) {
          const modalScrollable = findScrollableAncestor(event.target, modalRoot);
          if (modalScrollable) {
            return;
          }
        }

        event.preventDefault();
        return;
      }

      const delta = event.deltaY;
      if (Math.abs(delta) < 18) {
        return;
      }

      const direction = delta > 0 ? 1 : -1;
      const scrollable = findScrollableAncestor(event.target, rootElement);
      if (scrollable) {
        const canScrollDown = scrollable.scrollTop + scrollable.clientHeight < scrollable.scrollHeight - 1;
        const canScrollUp = scrollable.scrollTop > 1;

        if ((direction > 0 && canScrollDown) || (direction < 0 && canScrollUp)) {
          return;
        }
      }

      if (snapLockRef.current !== null) {
        event.preventDefault();
        return;
      }

      const sections = sectionRefs.current.filter(Boolean) as HTMLElement[];
      if (sections.length === 0) {
        return;
      }

      const nextIndex = clampIndex(activeSectionRef.current + direction, sections.length - 1);
      if (nextIndex === activeSectionRef.current) {
        return;
      }

      event.preventDefault();
      snapLockRef.current = window.setTimeout(() => {
        snapLockRef.current = null;
      }, 820);
      sections[nextIndex]?.scrollIntoView({ behavior: "smooth", block: "start" });
      activeSectionRef.current = nextIndex;
    }

    syncActiveSection();
    rootElement.addEventListener("wheel", handleWheel, { passive: false });
    rootElement.addEventListener("scroll", syncActiveSection, { passive: true });

    return () => {
      rootElement.removeEventListener("wheel", handleWheel);
      rootElement.removeEventListener("scroll", syncActiveSection);
      if (snapLockRef.current !== null) {
        window.clearTimeout(snapLockRef.current);
        snapLockRef.current = null;
      }
    };
  }, []);

  function toggleManualBlock(submissionId: number) {
    setManualBlockedSubmissionIds((current) =>
      current.includes(submissionId)
        ? current.filter((id) => id !== submissionId)
        : [...current, submissionId].sort((left, right) => left - right),
    );
  }

  return (
    <div
      ref={rootRef}
      className={`relative z-10 h-[calc(100vh-7rem)] overscroll-y-none scroll-smooth snap-y snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
        isModalOpen ? "overflow-hidden" : "overflow-y-auto"
      }`}
    >
      <section
        ref={(node) => {
          sectionRefs.current[0] = node;
        }}
        className="snap-start min-h-full py-2"
      >
        <div className="flex h-full flex-col gap-5">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.35em] text-lime-300/70">Insight & Settlement Room</p>
              <h1 className="mt-2 text-4xl font-semibold text-white">{title}</h1>
              <p className="mt-3 text-base leading-8 text-stone-300">
                Preview AI clustering, freeze the snapshot, and distribute the reward pool securely.
              </p>
            </div>
            <div className="flex w-full flex-col items-start gap-4 lg:w-auto lg:items-end">
              <BackToBountyButton bountyId={bountyId} />
              <InsightActions
                bountyId={bountyId}
                status={status}
                initialPreviewReady={status === "ANALYZING" && analysisStatus === "COMPLETED"}
              />
            </div>
          </div>

          <div className="relative z-[70] h-0 overflow-visible">
            <InsightsWaveOverlay />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
            {hasVisibleInsights ? (
              <div className="relative z-10 mt-3 space-y-6 overflow-visible">
                {clusters.length > 0 ? <ClusterChart clusters={clusters} /> : null}

                <InsightHighlightsCarousel highlights={highlights} questions={questions} entries={scoreBreakdown} />
              </div>
            ) : (
              <div className="mt-3 rounded-[2rem] border border-dashed border-white/10 bg-white/[0.03] px-8 py-14 text-center backdrop-blur-xl">
                <p className="text-xs uppercase tracking-[0.35em] text-lime-300/70">Awaiting analysis</p>
                <h2 className="mt-3 text-3xl font-semibold text-white">Run AI analysis to generate insight themes</h2>
                <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-stone-400">
                  Once analysis is complete, this section will show convergence clusters and AI-distilled highlights.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section
        ref={(node) => {
          sectionRefs.current[1] = node;
        }}
        className="snap-start min-h-full py-8"
      >
        <div className="flex h-full flex-col justify-center">
          <div className="relative z-10 mb-8 space-y-4">
            <div>
              
              <h2 className="-mt-2 text-3xl font-semibold text-white">Review the risk signals before freezing</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-400">
                Inspect hard rejections and high-risk submissions before deciding what goes into the frozen snapshot.
              </p>
            </div>
          </div>

          <div className="relative z-10 grid gap-6 lg:grid-cols-2 lg:items-start">
            <AntiSybilPanel disqualified={disqualified} />
            <HighRiskReviewPanel
              entries={highRiskEntries}
              blockedSubmissionIds={manualBlockedSubmissionIds}
              onToggle={toggleManualBlock}
              questions={questions}
            />
          </div>
        </div>
      </section>

      <section
        ref={(node) => {
          sectionRefs.current[2] = node;
        }}
        className="snap-start min-h-full py-8"
      >
        <div className="flex h-full flex-col justify-center ">
          <div className="space-y-4">
            <div>
              {scoreSnapshot ? (
                <>
                  <p className="text-xs uppercase tracking-[0.35em] text-lime-300/70">Frozen ranking</p>
                  <h2 className="mt-2 text-3xl font-semibold text-white">Creator-ready score snapshot</h2>
                </>
              ) : (
                <>
                  <h2 className="-mt-2 text-3xl font-semibold text-white">Preview distribution before snapshot freeze</h2>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-400">
                    {estimatedEntries.length > 0
                      ? "This is a working preview. The final payout will be recalculated and locked when you freeze the snapshot, including any high-risk submissions you manually exclude."
                      : "Run AI analysis to populate the preview table. Settlement remains locked until a snapshot is frozen."}
                  </p>
                </>
              )}
            </div>

            <div className="grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,3fr)]">
              <div className="space-y-6">
                {scoreSnapshot ? (
                  <ScoreTable entries={scoreSnapshot.entries} questions={questions} />
                ) : estimatedEntries.length > 0 ? (
                  <ScoreTable
                    entries={estimatedEntries}
                    questions={questions}
                    blockedSubmissionIds={manualBlockedSubmissionIds}
                  />
                ) : (
                  <div className="flex h-[28rem] items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/[0.03] px-8 text-center backdrop-blur-xl">
                    <div className="space-y-3">
                      <p className="text-xs uppercase tracking-[0.35em] text-lime-300/70">Preview pending</p>
                      <h3 className="text-2xl font-semibold text-white">No payout table yet</h3>
                      <p className="mx-auto max-w-xl text-sm leading-7 text-stone-400">
                        Freeze the submission set and run analysis to generate the ranking and payout preview.
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-6">
                <SettlementPanel
                  panelId={`settlement-panel-${bountyId}`}
                  bountyId={bountyId}
                  snapshotKey={scoreSnapshot?.snapshotKey ?? null}
                  creatorAddress={creatorAddress}
                  settled={settled}
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
