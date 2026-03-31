"use client";

import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { useState, type Dispatch, type SetStateAction } from "react";

import AnimatedList from "@/components/reactbits/AnimatedList";
import { createBlankQuestion, formatQuestionTypeLabel, isSelectQuestionType, QUESTION_TYPE_OPTIONS } from "@/lib/survey";
import type { SurveyQuestion, SurveyQuestionType } from "@/lib/types";

type SurveyBuilderProps = {
  questions: SurveyQuestion[];
  setQuestions: Dispatch<SetStateAction<SurveyQuestion[]>>;
};

function addQuestion(setQuestions: Dispatch<SetStateAction<SurveyQuestion[]>>, type: SurveyQuestionType) {
  setQuestions((current) => [...current, createBlankQuestion(type)]);
}

export function SurveyBuilder({ questions, setQuestions }: SurveyBuilderProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function updateQuestion(index: number, updater: (question: SurveyQuestion) => SurveyQuestion) {
    setQuestions((current) => current.map((question, questionIndex) => (questionIndex === index ? updater(question) : question)));
  }

  function removeQuestion(index: number) {
    setQuestions((current) => current.filter((_, questionIndex) => questionIndex !== index));
  }

  function setQuestionType(index: number, nextType: SurveyQuestionType) {
    updateQuestion(index, (question) => {
      const template = createBlankQuestion(nextType);

      return {
        ...question,
        type: nextType,
        options: isSelectQuestionType(nextType) ? (question.options?.length ? question.options : template.options) : undefined,
        allowOther: isSelectQuestionType(nextType) ? (question.allowOther ?? true) : undefined,
        placeholder: nextType === "text" ? (question.placeholder ?? template.placeholder) : undefined,
        helperText: nextType === "rating" ? (question.helperText || template.helperText) : question.helperText,
      };
    });
  }

  function updateOption(questionIndex: number, optionIndex: number, value: string) {
    updateQuestion(questionIndex, (question) => ({
      ...question,
      options: (question.options ?? []).map((option, currentIndex) => (currentIndex === optionIndex ? value : option)),
    }));
  }

  function addOption(questionIndex: number) {
    updateQuestion(questionIndex, (question) => ({
      ...question,
      options: [...(question.options ?? []), `Option ${(question.options?.length ?? 0) + 1}`],
    }));
  }

  function removeOption(questionIndex: number, optionIndex: number) {
    updateQuestion(questionIndex, (question) => ({
      ...question,
      options: (question.options ?? []).filter((_, currentIndex) => currentIndex !== optionIndex),
    }));
  }

  return (
    <div className="flex flex-col gap-6">
      {/* SECTION 2: Add Question Buttons */}
      <div className="flex w-full gap-3">
        {QUESTION_TYPE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => addQuestion(setQuestions, option.value)}
            className="flex-1 flex justify-center items-center gap-2 px-3 py-3 rounded-full bg-[#1A2E1F] border border-[#42D293]/40 text-[#42D293] hover:bg-[#42D293]/20 hover:border-[#42D293] hover:shadow-[0_0_12px_rgba(66,210,147,0.3)] transition-all text-xs font-bold tracking-wide whitespace-nowrap"
          >
            <Plus className="h-3.5 w-3.5" />
            {option.label}
          </button>
        ))}
      </div>

      {/* SECTION 3: Accordion Question List */}
      <div className="space-y-0">
        {questions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-800 p-6 text-sm text-zinc-500 text-center">
            Generate the AI survey first, or start from scratch using the buttons above.
          </div>
        ) : (
          <AnimatedList
            items={questions.map((question, questionIndex) => {
              const isExpanded = expandedId === question.id;

              return (
                <div key={question.id} className="bg-zinc-900/40 backdrop-blur-md border border-white/5 shadow-xl rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-[#42D293]/40 hover:shadow-[0_8px_30px_rgba(66,210,147,0.12)]">
                  {/* Collapsed Header */}
                  <div
                    className="p-4 flex justify-between items-center cursor-pointer hover:bg-zinc-800/60 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : question.id)}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-zinc-500 text-xs font-mono font-bold">Q{questionIndex + 1}</span>
                      <span className="text-zinc-200 text-sm font-medium">{question.label || "Untitled question"}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-black/40 text-zinc-400 border border-zinc-800">
                        {formatQuestionTypeLabel(question.type)}
                      </span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
                    </div>
                  </div>

                  {/* Expanded Body */}
                  {isExpanded && (
                    <div className="p-5 border-t border-zinc-800 bg-zinc-900/20">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-xs uppercase tracking-widest text-zinc-500">Edit Question</p>
                        <button
                          type="button"
                          onClick={() => removeQuestion(questionIndex)}
                          className="inline-flex items-center gap-2 rounded-lg border border-rose-500/20 px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2 mb-4">
                        <label className="space-y-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                          <span>Prompt</span>
                          <input
                            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 focus:border-[#42D293] focus:ring-1 focus:ring-[#42D293] text-sm text-zinc-200 outline-none transition-all"
                            value={question.label}
                            onChange={(event) => updateQuestion(questionIndex, (current) => ({ ...current, label: event.target.value }))}
                            placeholder="What do you want participants to answer?"
                          />
                        </label>
                        <label className="space-y-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                          <span>Input type</span>
                          <select
                            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 focus:border-[#42D293] focus:ring-1 focus:ring-[#42D293] text-sm text-zinc-200 outline-none transition-all"
                            value={question.type}
                            onChange={(event) => setQuestionType(questionIndex, event.target.value as SurveyQuestionType)}
                          >
                            {QUESTION_TYPE_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value} className="bg-[#09120d]">
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>

                      <div className="grid gap-4 md:grid-cols-[1fr_auto] mb-4">
                        <label className="space-y-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                          <span>Helper text</span>
                          <input
                            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 focus:border-[#42D293] focus:ring-1 focus:ring-[#42D293] text-sm text-zinc-200 outline-none transition-all"
                            value={question.helperText ?? ""}
                            onChange={(event) => updateQuestion(questionIndex, (current) => ({ ...current, helperText: event.target.value || undefined }))}
                            placeholder="Optional guidance below the question"
                          />
                        </label>
                        <label className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-sm text-zinc-200 mt-5">
                          <input
                            type="checkbox"
                            checked={question.required ?? true}
                            onChange={(event) => updateQuestion(questionIndex, (current) => ({ ...current, required: event.target.checked }))}
                            className="h-4 w-4 rounded border-zinc-700 bg-black"
                          />
                          Required
                        </label>
                      </div>

                      {question.type === "text" ? (
                        <label className="block space-y-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-4">
                          <span>Textarea placeholder</span>
                          <input
                            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 focus:border-[#42D293] focus:ring-1 focus:ring-[#42D293] text-sm text-zinc-200 outline-none transition-all"
                            value={question.placeholder ?? ""}
                            onChange={(event) => updateQuestion(questionIndex, (current) => ({ ...current, placeholder: event.target.value || undefined }))}
                            placeholder="Share a concrete suggestion..."
                          />
                        </label>
                      ) : null}

                      {isSelectQuestionType(question.type) ? (
                        <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                          <div className="flex items-center justify-between gap-3 mb-3">
                            <p className="text-xs uppercase tracking-widest text-zinc-500">Options</p>
                            <button
                              type="button"
                              onClick={() => addOption(questionIndex)}
                              className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 hover:border-zinc-500 bg-black/50 px-3 py-1.5 text-xs text-zinc-300 transition-colors"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              Add option
                            </button>
                          </div>

                          <div className="space-y-2 mb-4">
                            {(question.options ?? []).map((option, optionIndex) => (
                              <div key={`${question.id}-option-${optionIndex}`} className="flex items-center gap-2">
                                <input
                                  className="w-full bg-black/40 border border-zinc-800 rounded-xl px-4 py-2.5 focus:border-[#42D293] focus:ring-1 focus:ring-[#42D293] text-sm text-zinc-200 outline-none transition-all"
                                  value={option}
                                  onChange={(event) => updateOption(questionIndex, optionIndex, event.target.value)}
                                  placeholder={`Option ${optionIndex + 1}`}
                                />
                                <button
                                  type="button"
                                  onClick={() => removeOption(questionIndex, optionIndex)}
                                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 transition-colors"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>

                          <label className="flex items-center gap-3 text-sm text-zinc-300">
                            <input
                              type="checkbox"
                              checked={question.allowOther ?? true}
                              onChange={(event) => updateQuestion(questionIndex, (current) => ({ ...current, allowOther: event.target.checked }))}
                              className="h-4 w-4 rounded border-zinc-700 bg-black"
                            />
                            Let participants pick Other and type a custom answer
                          </label>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              );
            })}
            showGradients={false}
            enableArrowNavigation={false}
            displayScrollbar={false}
          />
        )}
      </div>
    </div>
  );
}
