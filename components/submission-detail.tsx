"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import type { SurveyQuestion } from "@/lib/types";

type SubmissionDetailProps = {
  submission: {
    id: number;
    summary: string;
    answers: Record<string, unknown>;
    submitterCoreAddress: string;
    payoutAddress: string;
    createdAt: string;
  };
  questions: SurveyQuestion[];
};

export function SubmissionDetail({ submission, questions }: SubmissionDetailProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const questionMap = new Map(questions.map((q) => [q.id, q]));

  return (
    <div className="rounded-2xl border border-white/8 bg-black/10 p-4">
      <button
        type="button"
        onClick={() => setIsExpanded((c) => !c)}
        className="flex w-full items-start justify-between gap-3 text-left"
      >
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-[0.3em] text-stone-500">Response #{submission.id}</p>
          <p className="mt-1 text-sm font-medium text-white">{submission.summary || "No summary"}</p>
        </div>
        <ChevronDown className={`mt-1 h-4 w-4 shrink-0 text-stone-400 transition ${isExpanded ? "rotate-180" : ""}`} />
      </button>

      {isExpanded ? (
        <div className="mt-4 space-y-3 border-t border-white/6 pt-4">
          {Object.entries(submission.answers).map(([questionId, answer]) => {
            const question = questionMap.get(questionId);
            const displayLabel = question?.label ?? questionId;
            const displayAnswer = Array.isArray(answer) ? answer.join(", ") : String(answer ?? "—");

            return (
              <div key={questionId}>
                <p className="text-xs uppercase tracking-[0.25em] text-stone-500">{displayLabel}</p>
                <p className="mt-1 text-sm leading-6 text-stone-200">{displayAnswer}</p>
              </div>
            );
          })}
          <div className="flex flex-wrap gap-4 pt-2 text-[11px] text-stone-500">
            <span>Core: {submission.submitterCoreAddress}</span>
            <span>Payout: {submission.payoutAddress}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
