"use client";

import { Plus, Trash2 } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";

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
    <div className="space-y-4 rounded-[2rem] border border-white/10 bg-black/20 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-lime-300/70">Question builder</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Edit the survey before publishing</h2>
          <p className="mt-2 text-sm leading-6 text-stone-400">Add, remove, or reshape any AI-generated question. Select questions can also collect custom Other answers.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {QUESTION_TYPE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => addQuestion(setQuestions, option.value)}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs text-white"
            >
              <Plus className="h-3.5 w-3.5" />
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {questions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-stone-400">
          Generate the AI survey first, or start from scratch with the add-question buttons above.
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((question, questionIndex) => (
            <section key={question.id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-stone-500">Question {questionIndex + 1}</p>
                  <p className="mt-2 text-sm text-stone-300">{formatQuestionTypeLabel(question.type)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeQuestion(questionIndex)}
                  className="inline-flex items-center gap-2 rounded-full border border-rose-300/20 px-4 py-2 text-xs text-rose-200"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm text-stone-300">
                  <span>Question prompt</span>
                  <input
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
                    value={question.label}
                    onChange={(event) => updateQuestion(questionIndex, (current) => ({ ...current, label: event.target.value }))}
                    placeholder="What do you want participants to answer?"
                  />
                </label>
                <label className="space-y-2 text-sm text-stone-300">
                  <span>Input type</span>
                  <select
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
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

              <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto]">
                <label className="space-y-2 text-sm text-stone-300">
                  <span>Helper text</span>
                  <input
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
                    value={question.helperText ?? ""}
                    onChange={(event) => updateQuestion(questionIndex, (current) => ({ ...current, helperText: event.target.value || undefined }))}
                    placeholder="Optional guidance below the question"
                  />
                </label>
                <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-stone-200">
                  <input
                    type="checkbox"
                    checked={question.required ?? true}
                    onChange={(event) => updateQuestion(questionIndex, (current) => ({ ...current, required: event.target.checked }))}
                    className="h-4 w-4 rounded border-white/20 bg-black/20"
                  />
                  Required
                </label>
              </div>

              {question.type === "text" ? (
                <label className="mt-4 block space-y-2 text-sm text-stone-300">
                  <span>Textarea placeholder</span>
                  <input
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
                    value={question.placeholder ?? ""}
                    onChange={(event) => updateQuestion(questionIndex, (current) => ({ ...current, placeholder: event.target.value || undefined }))}
                    placeholder="Share a concrete suggestion..."
                  />
                </label>
              ) : null}

              {isSelectQuestionType(question.type) ? (
                <div className="mt-4 space-y-3 rounded-2xl border border-cyan-300/12 bg-cyan-300/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-white">Options</p>
                    <button
                      type="button"
                      onClick={() => addOption(questionIndex)}
                      className="inline-flex items-center gap-2 rounded-full border border-cyan-300/15 px-4 py-2 text-xs text-cyan-100"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add option
                    </button>
                  </div>

                  <div className="space-y-2">
                    {(question.options ?? []).map((option, optionIndex) => (
                      <div key={`${question.id}-option-${optionIndex}`} className="flex items-center gap-2">
                        <input
                          className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
                          value={option}
                          onChange={(event) => updateOption(questionIndex, optionIndex, event.target.value)}
                          placeholder={`Option ${optionIndex + 1}`}
                        />
                        <button
                          type="button"
                          onClick={() => removeOption(questionIndex, optionIndex)}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 text-stone-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <label className="flex items-center gap-3 text-sm text-stone-200">
                    <input
                      type="checkbox"
                      checked={question.allowOther ?? true}
                      onChange={(event) => updateQuestion(questionIndex, (current) => ({ ...current, allowOther: event.target.checked }))}
                      className="h-4 w-4 rounded border-white/20 bg-black/20"
                    />
                    Let participants pick Other and type a custom answer
                  </label>
                </div>
              ) : null}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
