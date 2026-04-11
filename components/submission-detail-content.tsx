"use client";

import type { SurveyQuestion } from "@/lib/types";

export type SubmissionDetailRecord = {
  id: number;
  summary: string;
  answers: Record<string, unknown>;
  submitterCoreAddress: string;
  payoutAddress: string;
  createdAt: string;
};

export function stringifySubmissionAnswer(answer: unknown) {
  if (Array.isArray(answer)) {
    return answer.join(", ");
  }

  return String(answer ?? "").trim();
}

export function buildSubmissionPreviewText(
  submission: Pick<SubmissionDetailRecord, "summary" | "answers">,
  questions: SurveyQuestion[],
) {
  const questionMap = new Map(questions.map((question) => [question.id, question]));
  const answerEntries = Object.entries(submission.answers);

  return (
    submission.summary?.trim() ||
    answerEntries
      .map(([questionId, answer]) => {
        const label = questionMap.get(questionId)?.label;
        const content = stringifySubmissionAnswer(answer);
        if (!content) return "";
        return label ? `${label}: ${content}` : content;
      })
      .find(Boolean) ||
    "No summary"
  );
}

export function SubmissionDetailContent({
  submission,
  questions,
}: {
  submission: SubmissionDetailRecord;
  questions: SurveyQuestion[];
}) {
  const questionMap = new Map(questions.map((question) => [question.id, question]));
  const answerEntries = Object.entries(submission.answers);

  return (
    <>
      <div className="h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" />

      <div className="mt-5 divide-y divide-white/8">
        {answerEntries.map(([questionId, answer], index) => {
          const question = questionMap.get(questionId);
          const displayLabel = question?.label ?? questionId;
          const displayAnswer = stringifySubmissionAnswer(answer) || "-";

          return (
            <div key={`${submission.id}-${questionId}-${index}`} className="py-4 first:pt-0 last:pb-0">
              <p className="text-[11px] uppercase tracking-[0.25em] text-stone-500">{displayLabel}</p>
              <p className="mt-2 text-sm leading-7 text-stone-200 sm:text-[15px]">{displayAnswer}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-5 border-t border-white/8 pt-4 text-xs text-stone-500">
        <div className="flex flex-col gap-3">
          <div className="grid gap-1 md:grid-cols-[96px_minmax(0,1fr)]">
            <span className="uppercase tracking-[0.24em] text-stone-500">Core</span>
            <span className="break-all leading-6 text-stone-400">{submission.submitterCoreAddress}</span>
          </div>
          <div className="grid gap-1 md:grid-cols-[96px_minmax(0,1fr)]">
            <span className="uppercase tracking-[0.24em] text-stone-500">Payout</span>
            <span className="break-all leading-6 text-stone-400">{submission.payoutAddress}</span>
          </div>
        </div>
      </div>
    </>
  );
}
