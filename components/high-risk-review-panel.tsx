"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, ShieldCheck } from "lucide-react";

import { SubmissionInsightModal } from "@/components/submission-insight-modal";
import {
  type SubmissionDetailRecord,
} from "@/components/submission-detail-content";
import type { ScoreBreakdownEntry, SurveyQuestion } from "@/lib/types";
import { formatDate, truncateAddress } from "@/lib/utils";

type HighRiskEntry = ScoreBreakdownEntry & {
  submission?: {
    summary?: string;
    answers?: Record<string, unknown>;
    createdAt?: string;
  } | null;
};

export function HighRiskReviewPanel({
  entries,
  blockedSubmissionIds,
  onToggle,
  questions,
}: {
  entries: HighRiskEntry[];
  blockedSubmissionIds: number[];
  onToggle: (submissionId: number) => void;
  questions: SurveyQuestion[];
}) {
  const [activeSubmissionId, setActiveSubmissionId] = useState<number | null>(null);
  const blockedSet = new Set(blockedSubmissionIds);
  const hasEntries = entries.length > 0;

  const activeEntry = useMemo(
    () => entries.find((entry) => entry.submissionId === activeSubmissionId) ?? null,
    [activeSubmissionId, entries],
  );

  const activeSubmission: SubmissionDetailRecord | null =
    activeEntry
      ? {
          id: activeEntry.submissionId,
          summary: activeEntry.submission?.summary ?? activeEntry.summary ?? "",
          answers: activeEntry.submission?.answers ?? {},
          submitterCoreAddress: activeEntry.submitterCoreAddress,
          payoutAddress: activeEntry.payoutAddress,
          createdAt: activeEntry.submission?.createdAt ?? "",
        }
      : null;

  return (
    <>
      <div className="flex h-[28rem] flex-col overflow-hidden rounded-3xl border border-amber-400/20 bg-amber-400/5 backdrop-blur-xl transition-all duration-300">
        <div className="flex items-center gap-4 border-b border-white/8 px-6 py-6">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-full ${
              hasEntries ? "bg-amber-400/15 text-amber-200" : "bg-lime-400/10 text-lime-300"
            }`}
          >
            {hasEntries ? <AlertTriangle className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />}
          </div>
          <div>
            <h3 className={`text-lg font-semibold ${hasEntries ? "text-amber-100" : "text-lime-200"}`}>
              {hasEntries
                ? `High-Risk Review Queue - ${entries.length} Submission${entries.length > 1 ? "s" : ""}`
                : "High-Risk Review Queue"}
            </h3>
            <p className="mt-1 text-sm text-stone-400">
              {hasEntries
                ? "Review flagged submissions before freezing the snapshot."
                : "No high-risk submissions in the current preview."}
            </p>
          </div>
        </div>

        <div className="min-h-0 flex-1 px-6 py-4">
          {hasEntries ? (
            <div className="h-full overflow-y-auto overscroll-contain pr-1">
              <div className="grid gap-3">
                {entries.map((entry) => {
                  const isBlocked = blockedSet.has(entry.submissionId);
                  const answerCount = Object.keys(entry.submission?.answers ?? {}).length;

                  return (
                    <div
                      key={entry.submissionId}
                      className={`rounded-2xl border p-4 transition-colors ${
                        isBlocked
                          ? "border-rose-400/18 bg-rose-400/8"
                          : "border-amber-400/10 bg-black/20 hover:border-amber-300/20"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() => setActiveSubmissionId(entry.submissionId)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className="inline-flex h-4 w-4 cursor-help items-center justify-center"
                              title="High Sybil Risk - quality -75%, discovery/consensus disabled"
                            >
                              <AlertTriangle className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />
                            </span>
                            <span className="text-sm font-medium text-stone-100">
                              Submission #{entry.submissionId}
                            </span>
                            {isBlocked ? (
                              <span className="text-[11px] uppercase tracking-[0.22em] text-rose-200/85">
                                Excluded
                              </span>
                            ) : null}
                          </div>

                          <p className="mt-3 text-xs text-stone-500">
                            {answerCount} answer{answerCount === 1 ? "" : "s"} |{" "}
                            {truncateAddress(entry.payoutAddress, 10)} | {entry.rewardAmount} USDT0
                            {entry.submission?.createdAt ? ` | ${formatDate(entry.submission.createdAt)}` : ""}
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => onToggle(entry.submissionId)}
                          className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                            isBlocked
                              ? "bg-rose-300 text-stone-950"
                              : "border border-white/12 bg-transparent text-stone-200 hover:bg-white/5"
                          }`}
                        >
                          {isBlocked ? "Undo" : "Exclude"}
                        </button>
                      </div>
                    </div>
                    );
                  })}
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-lime-300/16 bg-lime-400/10 text-lime-300 shadow-[0_0_32px_rgba(163,230,53,0.08)]">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-medium text-white">No high-risk queue</p>
                <p className="text-sm text-stone-400">No flagged submissions need manual review right now.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <SubmissionInsightModal
        open={Boolean(activeSubmission)}
        submission={activeSubmission}
        questions={questions}
        onClose={() => setActiveSubmissionId(null)}
      />
    </>
  );
}
