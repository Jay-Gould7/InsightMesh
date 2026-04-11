"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

import type { SurveyQuestion } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import {
  buildSubmissionPreviewText,
  SubmissionDetailContent,
  type SubmissionDetailRecord,
} from "@/components/submission-detail-content";

type SubmissionDetailProps = {
  submission: SubmissionDetailRecord;
  questions: SurveyQuestion[];
};

function truncateText(value: string, limit: number) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= limit) {
    return normalized;
  }

  return `${normalized.slice(0, limit).trimEnd()}...`;
}

export function SubmissionDetail({ submission, questions }: SubmissionDetailProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const answerEntries = Object.entries(submission.answers);
  const answerCount = answerEntries.length;
  const previewSource = buildSubmissionPreviewText(submission, questions);

  const previewText = truncateText(previewSource, 120);

  return (
    <div
      className={`group relative overflow-hidden rounded-[1.9rem] border transition-all duration-500 ${
        isExpanded
          ? "border-lime-300/22 bg-[linear-gradient(180deg,rgba(120,255,178,0.05),rgba(255,255,255,0.035))] shadow-[0_22px_70px_rgba(61,195,137,0.1),inset_0_1px_0_rgba(255,255,255,0.06)]"
          : "border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.025))] shadow-[0_16px_42px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.04)] hover:-translate-y-0.5 hover:border-white/14 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.03))] hover:shadow-[0_22px_56px_rgba(0,0,0,0.22),0_0_30px_rgba(61,195,137,0.06),inset_0_1px_0_rgba(255,255,255,0.06)]"
      }`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(132,204,22,0.09),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.06),transparent_34%)] opacity-75" />
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent opacity-70" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-full w-[2px] bg-[linear-gradient(180deg,rgba(132,204,22,0),rgba(132,204,22,0.55),rgba(34,211,238,0.45),rgba(34,211,238,0))] opacity-55 transition-opacity duration-500 group-hover:opacity-80" />

      <button
        type="button"
        onClick={() => setIsExpanded((current) => !current)}
        aria-expanded={isExpanded}
        className="relative flex w-full items-start justify-between gap-4 p-5 text-left sm:p-6"
      >
        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-[0.32em] text-stone-500">
            Response #{submission.id}
          </p>

          <p className="mt-4 max-w-3xl text-[15px] leading-8 text-stone-100 sm:text-base">
            {previewText}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500">
            <span>{answerCount} answer{answerCount === 1 ? "" : "s"}</span>
            <span className="h-1 w-1 rounded-full bg-stone-600/80" />
            <span>{formatDate(submission.createdAt)}</span>
            <span className="h-1 w-1 rounded-full bg-stone-600/80" />
            <span>{isExpanded ? "Collapse" : "Expand"}</span>
          </div>

          <p className="sr-only">
            {isExpanded ? "Collapse submission details" : "Expand submission details"}
          </p>
        </div>

        <ChevronDown
          className={`mt-1 h-5 w-5 shrink-0 text-stone-400 transition-transform duration-500 ${
            isExpanded ? "rotate-180 text-lime-200" : "group-hover:text-stone-200"
          }`}
        />
      </button>

      <AnimatePresence initial={false}>
        {isExpanded ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden"
          >
            <div className="px-5 pb-5 sm:px-6 sm:pb-6">
              <SubmissionDetailContent submission={submission} questions={questions} />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
