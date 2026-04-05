"use client";

import { useRouter } from "next/navigation";
import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { Check, SendHorizontal, Star, X } from "lucide-react";

import { useESpaceWallet } from "@/components/providers/espace-provider";
import { useFluentWallet } from "@/components/providers/fluent-provider";
import { submitFeedbackOnCore } from "@/lib/conflux/browser-core";
import { fakeBrowserTxHash } from "@/lib/demo-browser";
import { hashContent } from "@/lib/hash";
import { OTHER_OPTION_VALUE, prepareSurveyAnswers, sanitizeSurveyQuestions } from "@/lib/survey";
import type { CoreSpaceConfig, SurveyQuestion } from "@/lib/types";
import { truncateAddress } from "@/lib/utils";

const truthy = new Set(["1", "true", "yes", "on"]);
const demoMode = truthy.has((process.env.NEXT_PUBLIC_DEMO_MODE ?? "true").toLowerCase());

const questionTypeLabels: Record<SurveyQuestion["type"], string> = {
  rating: "Rating",
  single_select: "Single select",
  multi_select: "Multi select",
  text: "Text input",
};

function isQuestionAnswered(question: SurveyQuestion, answer: unknown, otherAnswer?: string) {
  if (question.type === "rating") {
    const value = typeof answer === "number" ? answer : Number(answer);
    return Number.isFinite(value);
  }

  if (question.type === "text") {
    return String(answer ?? "").trim().length > 0;
  }

  if (question.type === "single_select") {
    const selected = typeof answer === "string" ? answer : "";
    if (!selected) return false;
    if (selected !== OTHER_OPTION_VALUE) return true;
    return Boolean(otherAnswer?.trim());
  }

  const values = Array.isArray(answer) ? answer.map((item) => String(item)) : [];
  if (!values.length) return false;
  if (!values.includes(OTHER_OPTION_VALUE)) return true;
  return Boolean(otherAnswer?.trim());
}

export function SurveyForm({ bounty, coreConfig }: { bounty: any; coreConfig: CoreSpaceConfig }) {
  const router = useRouter();
  const { address: coreAddress } = useFluentWallet();
  const { address: eSpaceAddress } = useESpaceWallet();
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [otherAnswers, setOtherAnswers] = useState<Record<string, string>>({});
  const [payoutAddress, setPayoutAddress] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStage, setSubmitStage] = useState("");
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const lastSuggestedPayout = useRef("");
  const questions = useMemo(
    () => sanitizeSurveyQuestions(Array.isArray(bounty.questions) ? bounty.questions : []),
    [bounty.questions],
  ) as SurveyQuestion[];

  const answeredCount = useMemo(
    () =>
      questions.filter((question) =>
        isQuestionAnswered(question, answers[question.id], otherAnswers[question.id]),
      ).length,
    [answers, otherAnswers, questions],
  );
  const totalQuestions = questions.length;
  const progressPercent = totalQuestions ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  useEffect(() => {
    if (!eSpaceAddress) return;

    setPayoutAddress((current) => {
      if (!current || current === lastSuggestedPayout.current) {
        lastSuggestedPayout.current = eSpaceAddress;
        return eSpaceAddress;
      }

      lastSuggestedPayout.current = eSpaceAddress;
      return current;
    });
  }, [eSpaceAddress]);

  function updateAnswer(id: string, value: unknown) {
    setAnswers((current) => ({ ...current, [id]: value }));
  }

  function toggleMultiSelect(questionId: string, option: string) {
    setAnswers((current) => {
      const existing = Array.isArray(current[questionId]) ? (current[questionId] as string[]) : [];
      const active = existing.includes(option);
      const next = active ? existing.filter((item) => item !== option) : [...existing, option];
      return { ...current, [questionId]: next };
    });
  }

  async function handleSubmit() {
    setError("");
    setShowSuccessToast(false);
    setIsSubmitting(true);

    try {
      if (!coreAddress || !payoutAddress) {
        throw new Error("Connect your Core wallet and provide the payout address before submitting.");
      }

      if (typeof bounty.chainBountyId !== "number") {
        throw new Error("This bounty is not active on Core Space yet.");
      }

      const normalized = prepareSurveyAnswers(questions, answers, otherAnswers);
      if ("error" in normalized) {
        throw new Error(normalized.error);
      }

      const contentHash = hashContent({
        bountyId: bounty.id,
        answers: normalized.answers,
        payoutAddress,
      });
      let coreTxHash = fakeBrowserTxHash();

      if (coreConfig.mode !== "demo" && !demoMode) {
        setSubmitStage("Confirm the sponsored Core submit transaction in Fluent...");
        const result = await submitFeedbackOnCore({
          chainBountyId: bounty.chainBountyId,
          submitterCoreAddress: coreAddress,
          payoutAddress,
          contentHash,
          core: coreConfig,
        });
        coreTxHash = result.coreTxHash;
      } else {
        setSubmitStage("Simulating the Core submit transaction in demo mode...");
      }

      setSubmitStage("Verifying the Core submit transaction...");
      const response = await fetch("/api/submission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bountyId: bounty.id,
          submitterCoreAddress: coreAddress,
          payoutAddress,
          answers: normalized.answers,
          coreTxHash,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to submit feedback.");
      }

      setShowSuccessToast(true);
      startTransition(() => router.refresh());
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to submit feedback.");
    } finally {
      setSubmitStage("");
      setIsSubmitting(false);
    }
  }

  return (
    <div
      data-survey-form-root
      className="relative overflow-hidden rounded-[2rem] border-2 border-[#35c04c]/44 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.18),0_0_0_1px_rgba(53,192,76,0.18),0_0_44px_rgba(53,192,76,0.1)] backdrop-blur-xl"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,197,94,0.1),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.08),transparent_28%)]" />
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#35c04c]/72 to-transparent" />

      <div className="relative space-y-8">
      <div className="grid gap-4 md:grid-cols-[72px_minmax(0,1fr)] md:items-start">
        <div className="flex flex-col items-center gap-3 py-2">
          <div className="flex items-start gap-3">
            <p className="text-[9px] uppercase tracking-[0.18em] text-stone-500 [writing-mode:vertical-lr] [text-orientation:upright] md:text-[10px]">
              Answered
            </p>
            <div className="relative h-14 w-2 overflow-hidden rounded-full bg-black/25 md:h-30">
              <div
                className="absolute inset-x-0 bottom-0 rounded-full bg-[linear-gradient(180deg,#67e8f9_0%,#84cc16_100%)] transition-all duration-500"
                style={{ height: `${progressPercent}%` }}
              />
            </div>
          </div>
          <div className="-mt-1 min-w-0 text-center md:-mt-2">
            <p className="text-xs font-semibold tabular-nums text-white md:text-sm">
              {answeredCount}/{totalQuestions || 0}
            </p>
          </div>
        </div>

        <div className="min-w-0 py-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/80">Payout address</p>
              <p className="mt-2 text-base font-semibold text-white">
                Fill the eSpace address that should receive any reward
              </p>
            </div>
            {eSpaceAddress ? (
              <button
                type="button"
                onClick={() => setPayoutAddress(eSpaceAddress)}
                className="rounded-full border border-cyan-200/20 bg-white/[0.04] px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100 transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-200/35 hover:bg-white/[0.07]"
              >
                Use connected eSpace
              </button>
            ) : null}
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
            <label className="space-y-2 text-sm text-stone-300">
              <span className="text-xs uppercase tracking-[0.24em] text-stone-500">eSpace payout address</span>
              <input
                className="w-full rounded-2xl border border-cyan-300/15 bg-black/20 px-4 py-3 text-white outline-none transition-all duration-300 placeholder:text-stone-600 focus:border-cyan-200/35 focus:bg-black/30 focus:shadow-[0_0_0_4px_rgba(34,211,238,0.08)]"
                value={payoutAddress}
                onChange={(event) => setPayoutAddress(event.target.value)}
                placeholder="0x..."
              />
            </label>

            <div className="space-y-2 text-sm text-stone-300">
              <span className="text-xs uppercase tracking-[0.24em] text-stone-500">Detected eSpace wallet</span>
              <div className="flex h-[50px] items-center rounded-2xl border border-cyan-300/12 bg-black/20 px-4 text-white">
                {eSpaceAddress ? truncateAddress(eSpaceAddress, 10) : "Optional"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
          {questions.length === 0 ? (
            <div
              data-survey-flow-target
              className="rounded-[1.75rem] border border-white/10 bg-black/20 p-6 text-sm text-stone-400"
            >
              No questions are available for this bounty yet.
            </div>
          ) : null}

          <div className="border-t border-white/8 divide-y divide-white/8">
          {questions.map((question, index) => {
            const selectedSingle = typeof answers[question.id] === "string" ? (answers[question.id] as string) : "";
            const selectedMany = Array.isArray(answers[question.id]) ? (answers[question.id] as string[]) : [];
            const isOtherSelected =
              question.type === "single_select"
                ? selectedSingle === OTHER_OPTION_VALUE
                : selectedMany.includes(OTHER_OPTION_VALUE);
            const answered = isQuestionAnswered(question, answers[question.id], otherAnswers[question.id]);

            return (
              <div
                key={question.id}
                data-survey-flow-target={index === 0 ? "true" : undefined}
                className="group relative py-6 last:pb-0 sm:py-7"
              >
                <div className="relative">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] uppercase tracking-[0.26em] text-stone-500">
                          <p className="text-stone-300">Q{index + 1}</p>
                          <span className="h-1 w-1 rounded-full bg-stone-700/90" />
                          <span>
                            {questionTypeLabels[question.type]}
                          </span>
                          <span className="h-1 w-1 rounded-full bg-stone-700/90" />
                          <span
                            className={question.required ? "text-lime-200" : "text-stone-500"}
                          >
                            {question.required ? "Required" : "Optional"}
                          </span>
                        </div>

                        <p className="mt-3 text-lg font-semibold leading-8 text-white">{question.label}</p>
                        {question.helperText ? (
                          <p className="mt-2 max-w-3xl text-sm leading-7 text-stone-400">{question.helperText}</p>
                        ) : null}
                      </div>
                    </div>

                    <div
                      className={`pt-0.5 text-[11px] uppercase tracking-[0.24em] ${
                        answered ? "text-lime-200" : "text-stone-500"
                      }`}
                    >
                      {answered ? "Answered" : "Pending"}
                    </div>
                  </div>

                  {question.type === "rating" ? (
                    <div className="mt-5">
                      <div className="flex flex-wrap items-center gap-2">
                        {[1, 2, 3, 4, 5].map((value) => {
                          const selectedValue =
                            typeof answers[question.id] === "number"
                              ? (answers[question.id] as number)
                              : Number(answers[question.id] ?? 0);
                          const active = Number.isFinite(selectedValue) && selectedValue >= value;
                          const exact = answers[question.id] === value;
                          return (
                            <button
                              key={value}
                              type="button"
                              onClick={() => updateAnswer(question.id, value)}
                              aria-pressed={active}
                              aria-label={`Rate ${value} out of 5`}
                              className={`group/star flex h-12 w-12 items-center justify-center rounded-2xl border transition-all duration-300 ${
                                active
                                  ? "border-amber-300/30 bg-amber-300/[0.12] text-amber-200 shadow-[0_12px_28px_rgba(251,191,36,0.12)]"
                                  : "border-white/10 bg-black/20 text-stone-500 hover:-translate-y-0.5 hover:border-white/16 hover:bg-white/[0.05] hover:text-stone-200"
                              }`}
                            >
                              <Star
                                className={`h-5 w-5 transition-all duration-300 ${
                                  active
                                    ? "fill-current scale-110"
                                    : "fill-transparent group-hover/star:scale-105"
                                } ${exact ? "drop-shadow-[0_0_10px_rgba(251,191,36,0.25)]" : ""}`}
                              />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  {question.type === "text" ? (
                    <textarea
                      className="mt-5 min-h-32 w-full rounded-[1.5rem] border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition-all duration-300 placeholder:text-stone-600 focus:border-cyan-200/28 focus:bg-black/28 focus:shadow-[0_0_0_4px_rgba(34,211,238,0.07)]"
                      placeholder={question.placeholder}
                      value={String(answers[question.id] ?? "")}
                      onChange={(event) => updateAnswer(question.id, event.target.value)}
                    />
                  ) : null}

                  {(question.type === "single_select" || question.type === "multi_select") && question.options ? (
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      {question.options.map((option) => {
                        const active =
                          question.type === "single_select"
                            ? selectedSingle === option
                            : selectedMany.includes(option);

                        return (
                          <button
                            key={option}
                            type="button"
                            aria-pressed={active}
                            className={`group/option rounded-[1.4rem] border p-4 text-left transition-all duration-300 ${
                              active
                                ? "border-cyan-200/30 bg-cyan-300/[0.12] text-white shadow-[0_14px_30px_rgba(34,211,238,0.08)]"
                                : "border-white/10 bg-black/20 text-stone-200 hover:-translate-y-0.5 hover:border-white/16 hover:bg-white/[0.04]"
                            }`}
                            onClick={() => {
                              if (question.type === "single_select") {
                                updateAnswer(question.id, option);
                                return;
                              }

                              toggleMultiSelect(question.id, option);
                            }}
                          >
                            <span className="flex items-start gap-3">
                              <span
                                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
                                  active
                                    ? "border-cyan-100/50 bg-cyan-100/15 text-cyan-100"
                                    : "border-white/14 bg-transparent text-transparent"
                                }`}
                              >
                                <Check className="h-3.5 w-3.5" />
                              </span>
                              <span className="min-w-0 text-sm leading-6">{option}</span>
                            </span>
                          </button>
                        );
                      })}

                      {question.allowOther ? (
                        <button
                          type="button"
                          aria-pressed={isOtherSelected}
                          className={`group/option rounded-[1.4rem] border p-4 text-left transition-all duration-300 ${
                            isOtherSelected
                              ? "border-cyan-200/30 bg-cyan-300/[0.12] text-white shadow-[0_14px_30px_rgba(34,211,238,0.08)]"
                              : "border-white/10 bg-black/20 text-stone-200 hover:-translate-y-0.5 hover:border-white/16 hover:bg-white/[0.04]"
                          }`}
                          onClick={() => {
                            if (question.type === "single_select") {
                              updateAnswer(question.id, OTHER_OPTION_VALUE);
                              return;
                            }

                            toggleMultiSelect(question.id, OTHER_OPTION_VALUE);
                          }}
                        >
                          <span className="flex items-start gap-3">
                            <span
                              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
                                isOtherSelected
                                  ? "border-cyan-100/50 bg-cyan-100/15 text-cyan-100"
                                  : "border-white/14 bg-transparent text-transparent"
                              }`}
                            >
                              <Check className="h-3.5 w-3.5" />
                            </span>
                            <span className="min-w-0 text-sm leading-6">Other</span>
                          </span>
                        </button>
                      ) : null}
                    </div>
                  ) : null}

                  {isOtherSelected ? (
                    <div className="mt-4 rounded-[1.5rem] border border-cyan-300/15 bg-cyan-300/[0.05] p-3">
                      <input
                        className="w-full rounded-2xl border border-cyan-300/15 bg-black/20 px-4 py-3 text-white outline-none transition-all duration-300 placeholder:text-stone-600 focus:border-cyan-200/35 focus:bg-black/28 focus:shadow-[0_0_0_4px_rgba(34,211,238,0.07)]"
                        placeholder="Type your custom answer"
                        value={otherAnswers[question.id] ?? ""}
                        onChange={(event) =>
                          setOtherAnswers((current) => ({
                            ...current,
                            [question.id]: event.target.value,
                          }))
                        }
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
          </div>
        </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="order-2 min-h-[50px] flex-1 md:order-1">
            {submitStage ? (
              <div className="w-full max-w-2xl rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.08] px-4 py-3 text-sm text-cyan-100">
                {submitStage}
              </div>
            ) : null}

            {error ? (
              <div className="w-full max-w-2xl rounded-2xl border border-rose-400/18 bg-rose-400/[0.08] px-4 py-3 text-sm text-rose-200">
                {error}
              </div>
            ) : null}
          </div>

          <div className="order-1 flex justify-end md:order-2">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="group relative inline-flex h-[50px] min-w-[228px] items-center justify-center overflow-hidden rounded-full border border-lime-200/30 bg-lime-300 px-7 text-[17px] font-semibold text-[#09120b] shadow-[0_16px_32px_rgba(163,230,53,0.18),inset_0_1px_0_rgba(255,255,255,0.24)] transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] hover:-translate-y-0.5 hover:border-lime-100/50 hover:bg-[#d8ff68] hover:shadow-[0_22px_40px_rgba(163,230,53,0.24),0_0_36px_rgba(163,230,53,0.16),inset_0_1px_0_rgba(255,255,255,0.3)] active:translate-y-0 active:scale-[0.985] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_left,rgba(255,255,255,0.34),transparent_58%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              />
              <span
                aria-hidden
                className="pointer-events-none absolute left-[18px] top-1/2 z-10 flex h-4.5 w-4.5 -translate-y-1/2 -translate-x-2 scale-75 items-center justify-center text-[#09120b] opacity-0 transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:translate-x-0 group-hover:scale-100 group-hover:opacity-100"
              >
                <SendHorizontal className="h-[18px] w-[18px] transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:scale-110" />
              </span>
              <span className="relative z-10 transition-transform duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:translate-x-3">
                {isSubmitting ? "Submitting..." : "Submit feedback"}
              </span>
              <span
                aria-hidden
                className="relative z-10 ml-2 h-1.5 w-1.5 rounded-full bg-[#09120b]/80 transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:ml-0 group-hover:w-0 group-hover:scale-0 group-hover:opacity-0"
              />
            </button>
          </div>
        </div>
      </div>
      {showSuccessToast ? (
        <div className="fixed bottom-6 right-6 z-[90] w-[min(360px,calc(100vw-2rem))] rounded-[24px] border border-emerald-300/16 bg-[linear-gradient(180deg,rgba(10,24,16,0.96),rgba(10,10,10,0.94))] p-4 shadow-[0_24px_64px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
          <button
            type="button"
            onClick={() => setShowSuccessToast(false)}
            className="absolute right-3 top-3 rounded-full border border-white/10 bg-white/[0.04] p-1.5 text-zinc-400 transition-colors hover:border-white/15 hover:text-white"
            aria-label="Dismiss success message"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <div className="pr-8">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-emerald-300/18 bg-emerald-400/12 text-emerald-200">
                <Check className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200/75">
                  Success
                </p>
                <p className="mt-1 text-base font-semibold text-white">
                  Submission successful
                </p>
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-zinc-300">
              Your feedback has been submitted successfully.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
