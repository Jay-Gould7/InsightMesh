"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Check } from "lucide-react";
import type { SurveyQuestion } from "@/lib/types";
import type { SubmissionDetailRecord } from "@/components/submission-detail-content";
import { SubmissionInsightModal } from "@/components/submission-insight-modal";
import { formatDate, truncateAddress } from "@/lib/utils";

type ScoreTableEntry = {
  id?: number;
  submissionId: number;
  participationPts: number;
  qualityPts: number;
  discoveryBonus: number;
  consensusBonus: number;
  totalPoints: number;
  rewardAmount: string;
  rank?: number | null;
  summary?: string;
  payoutAddress?: string;
  sybilRiskLevel?: "high";
  submission?: {
    summary?: string;
    answers?: Record<string, unknown>;
    createdAt?: string;
    submitterCoreAddress?: string;
    payoutAddress?: string;
  } | null;
};

function StatusIcon({
  entry,
  isBlocked,
}: {
  entry: ScoreTableEntry;
  isBlocked: boolean;
}) {
  if (isBlocked) {
    return (
      <span className="inline-flex h-4 w-4 items-center justify-center" title="Excluded from preview payout">
        <AlertTriangle className="h-3.5 w-3.5 fill-rose-300 text-rose-300" />
      </span>
    );
  }

  if (entry.sybilRiskLevel === "high") {
    return (
      <span className="inline-flex h-4 w-4 items-center justify-center" title="High Sybil Risk">
        <AlertTriangle className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />
      </span>
    );
  }

  return (
    <span className="inline-flex h-4 w-4 items-center justify-center" title="Eligible submission">
      <Check className="h-3.5 w-3.5 text-emerald-300" strokeWidth={3} />
    </span>
  );
}

function ScoreTableRow({
  entry,
  index,
  isBlocked,
  onOpen,
}: {
  entry: ScoreTableEntry;
  index: number;
  isBlocked: boolean;
  onOpen: () => void;
}) {
  const createdAt = entry.submission?.createdAt;
  const payoutAddress = entry.submission?.payoutAddress ?? entry.payoutAddress ?? "-";

  return (
    <>
      <tr className="group cursor-pointer transition-colors hover:bg-white/[0.02]" onClick={onOpen}>
        <td className="px-4 py-4 align-top w-16">
          <span className="font-mono text-stone-400">{typeof entry.rank === "number" ? `#${entry.rank}` : "--"}</span>
        </td>
        <td className="px-4 py-4 max-w-xl">
          <div className="flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <StatusIcon entry={entry} isBlocked={isBlocked} />
                <p className="text-sm font-medium text-stone-100">Submission #{entry.submissionId}</p>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-stone-400">
                <span className="flex items-center gap-1"><span className="text-stone-500">Participation</span> <span className="text-stone-300 font-mono">{entry.participationPts}</span></span>
                <span className="h-1 w-1 rounded-full bg-stone-700" />
                <span className="flex items-center gap-1"><span className="text-stone-500">Quality</span> <span className="text-lime-300 font-mono">{entry.qualityPts}</span></span>
                <span className="h-1 w-1 rounded-full bg-stone-700" />
                <span className="flex items-center gap-1"><span className="text-stone-500">Discovery</span> <span className="text-amber-300 font-mono">{entry.discoveryBonus}</span></span>
                <span className="h-1 w-1 rounded-full bg-stone-700" />
                <span className="flex items-center gap-1"><span className="text-stone-500">Consensus</span> <span className="text-sky-300 font-mono">{entry.consensusBonus}</span></span>
              </div>

              <p className="mt-2 text-xs text-stone-500">
                {truncateAddress(payoutAddress, 10)}
                {createdAt ? ` | ${formatDate(createdAt)}` : ""}
              </p>
            </div>
          </div>
        </td>
        <td className="px-4 py-4 align-top w-24">
          <span className="font-semibold text-lime-200">{entry.totalPoints} pts</span>
        </td>
        <td className="px-4 py-4 align-top w-32">
          <span className="inline-flex items-center gap-1.5 font-semibold text-white">
            {entry.rewardAmount ?? "0.00"} USDT
          </span>
        </td>
      </tr>
    </>
  );
}

export function ScoreTable({
  entries,
  questions = [],
  blockedSubmissionIds = [],
}: {
  entries: ScoreTableEntry[];
  questions?: SurveyQuestion[];
  blockedSubmissionIds?: number[];
}) {
  const [activeSubmissionId, setActiveSubmissionId] = useState<number | null>(null);
  const blockedSet = useMemo(() => new Set(blockedSubmissionIds), [blockedSubmissionIds]);
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
          submitterCoreAddress: activeEntry.submission?.submitterCoreAddress ?? "",
          payoutAddress: activeEntry.submission?.payoutAddress ?? activeEntry.payoutAddress ?? "",
          createdAt: activeEntry.submission?.createdAt ?? "",
        }
      : null;

  return (
    <>
      <div className="flex h-[28rem] flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <table className="min-w-full divide-y divide-white/10 text-sm">
            <thead className="sticky top-0 z-10 bg-[linear-gradient(180deg,rgba(22,32,26,0.98),rgba(20,30,24,0.96))] text-left text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-400 backdrop-blur-xl">
              <tr>
                <th className="px-4 py-4 w-16">Rank</th>
                <th className="px-4 py-4 max-w-xl">Submission & Breakdown</th>
                <th className="px-4 py-4 w-24">Score</th>
                <th className="px-4 py-4 w-32">Reward</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/8 text-stone-200">
              {entries.map((entry, index) => (
                <ScoreTableRow
                  key={entry.id ?? `${entry.submissionId}-${index}`}
                  entry={entry}
                  index={index}
                  isBlocked={blockedSet.has(entry.submissionId)}
                  onOpen={() => setActiveSubmissionId(entry.submissionId)}
                />
              ))}
            </tbody>
          </table>
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
