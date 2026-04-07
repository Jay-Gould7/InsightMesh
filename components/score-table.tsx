"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { SurveyQuestion } from "@/lib/types";

function stringifyAnswer(answer: unknown) {
  if (Array.isArray(answer)) {
    return answer.join(", ");
  }
  return String(answer ?? "").trim();
}

function truncateText(value: string, limit: number) {
  if (!value) return "";
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= limit) {
    return normalized;
  }
  return `${normalized.slice(0, limit).trimEnd()}...`;
}

function ScoreTableRow({ entry, index, questions }: { entry: any; index: number; questions?: SurveyQuestion[] }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const summary = entry.submission?.summary ?? entry.summary ?? "";
  
  // Decide expandability based on whether we have full answers or just a long summary
  const hasAnswers = entry.submission?.answers && Object.keys(entry.submission.answers).length > 0;
  const isExpandable = hasAnswers || summary.length > 80;

  const questionMap = new Map(questions?.map((q) => [q.id, q]) ?? []);
  const answerEntries = hasAnswers ? Object.entries(entry.submission.answers) : [];

  return (
    <>
      <tr 
        className={`group transition-colors ${isExpandable ? "cursor-pointer hover:bg-white/[0.02]" : ""}`}
        onClick={() => isExpandable && setIsExpanded(!isExpanded)}
      >
        <td className="px-4 py-4 align-top w-16">
          <span className="font-mono text-stone-400">#{entry.rank ?? index + 1}</span>
        </td>
        <td className="px-4 py-4 max-w-xl">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white/90 leading-relaxed">
                {isExpandable && !isExpanded ? truncateText(summary, 80) : null}
              </p>
              <AnimatePresence initial={false}>
                {(!isExpandable || isExpanded) && (
                  <motion.div
                    initial={isExpandable ? { height: 0, opacity: 0 } : false}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 pt-1 border-t border-white/10 divide-y divide-white/8">
                      {hasAnswers ? (
                        answerEntries.map(([questionId, answer], idx) => {
                          const question = questionMap.get(questionId);
                          const displayLabel = question?.label ?? questionId;
                          const displayAnswer = stringifyAnswer(answer) || "-";
                          return (
                            <motion.div
                              key={questionId}
                              initial={{ opacity: 0, y: 12 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.24, delay: Math.min(idx * 0.035, 0.18) }}
                              className="py-4 last:pb-2"
                            >
                              <p className="text-[11px] uppercase tracking-[0.25em] text-stone-500">
                                {displayLabel}
                              </p>
                              <p className="mt-2 text-sm leading-7 text-stone-200">
                                {displayAnswer}
                              </p>
                            </motion.div>
                          );
                        })
                      ) : (
                        <p className="py-4 font-medium text-white/90 leading-relaxed">{summary}</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mt-2 flex items-center gap-3 text-xs text-stone-400">
                <span className="flex items-center gap-1"><span className="text-stone-500">Participation</span> <span className="text-stone-300 font-mono">{entry.participationPts}</span></span>
                <span className="h-1 w-1 rounded-full bg-stone-700" />
                <span className="flex items-center gap-1"><span className="text-stone-500">Quality</span> <span className="text-lime-300 font-mono">{entry.qualityPts}</span></span>
                <span className="h-1 w-1 rounded-full bg-stone-700" />
                <span className="flex items-center gap-1"><span className="text-stone-500">Discovery</span> <span className="text-amber-300 font-mono">{entry.discoveryBonus}</span></span>
                <span className="h-1 w-1 rounded-full bg-stone-700" />
                <span className="flex items-center gap-1"><span className="text-stone-500">Consensus</span> <span className="text-sky-300 font-mono">{entry.consensusBonus}</span></span>
              </div>
            </div>
            {isExpandable && (
              <ChevronDown 
                className={`w-4 h-4 mt-1 text-stone-500 transition-transform duration-300 ${isExpanded ? "rotate-180 text-lime-400" : "group-hover:text-stone-300"}`} 
              />
            )}
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

export function ScoreTable({ entries, questions }: { entries: any[]; questions?: SurveyQuestion[] }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
      <table className="min-w-full divide-y divide-white/10 text-sm">
        <thead className="bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent)] text-left text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-400">
          <tr>
            <th className="px-4 py-4 w-16">Rank</th>
            <th className="px-4 py-4 max-w-xl">Submission & Breakdown</th>
            <th className="px-4 py-4 w-24">Score</th>
            <th className="px-4 py-4 w-32">Reward</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/8 text-stone-200">
          {entries.map((entry, index) => (
            <ScoreTableRow key={entry.id ?? `${entry.submissionId}-${index}`} entry={entry} index={index} questions={questions} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
