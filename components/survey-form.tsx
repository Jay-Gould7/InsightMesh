"use client";

import { useRouter } from "next/navigation";
import { startTransition, useEffect, useMemo, useRef, useState } from "react";

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
  const lastSuggestedPayout = useRef("");
  const questions = useMemo(() => sanitizeSurveyQuestions(Array.isArray(bounty.questions) ? bounty.questions : []), [bounty.questions]) as SurveyQuestion[];

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
      const existing = Array.isArray(current[questionId]) ? current[questionId] as string[] : [];
      const active = existing.includes(option);
      const next = active ? existing.filter((item) => item !== option) : [...existing, option];
      return { ...current, [questionId]: next };
    });
  }

  async function handleSubmit() {
    setError("");
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

      const contentHash = hashContent({ bountyId: bounty.id, answers: normalized.answers, payoutAddress });
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
        body: JSON.stringify({ bountyId: bounty.id, submitterCoreAddress: coreAddress, payoutAddress, answers: normalized.answers, coreTxHash }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to submit feedback.");
      }

      startTransition(() => router.refresh());
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to submit feedback.");
    } finally {
      setSubmitStage("");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      <div><p className="text-xs uppercase tracking-[0.35em] text-lime-300/70">Gas-sponsored submit</p><h2 className="mt-2 text-2xl font-semibold text-white">Bind your payout address and respond</h2></div>
      <div className="mt-6 rounded-3xl border border-cyan-300/15 bg-cyan-300/5 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Reward destination</p>
            <h3 className="mt-2 text-lg font-medium text-white">Enter the eSpace address that should receive any payout</h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-400">
              You can paste an address directly. Connecting an eSpace wallet is optional for participants and only helps autofill this field.
            </p>
          </div>
          {eSpaceAddress ? (
            <button
              type="button"
              onClick={() => setPayoutAddress(eSpaceAddress)}
              className="rounded-full border border-cyan-300/20 px-4 py-2 text-xs uppercase tracking-[0.25em] text-cyan-100"
            >
              Use connected eSpace
            </button>
          ) : null}
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-[1.4fr_0.6fr]">
          <label className="space-y-2 text-sm text-stone-300">
            <span>eSpace payout address</span>
            <input
              className="w-full rounded-2xl border border-cyan-300/15 bg-black/20 px-4 py-3 text-white outline-none"
              value={payoutAddress}
              onChange={(event) => setPayoutAddress(event.target.value)}
              placeholder="0x..."
            />
          </label>
          <div className="space-y-2 text-sm text-stone-300">
            <span>Detected eSpace wallet</span>
            <div className="rounded-2xl border border-cyan-300/12 bg-black/20 px-4 py-3 text-white">
              {eSpaceAddress ? truncateAddress(eSpaceAddress, 10) : "Optional"}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="space-y-2 text-sm text-stone-300">
          <span>Connected Core submitter</span>
          <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white">
            {coreAddress ? truncateAddress(coreAddress, 10) : "Connect Core in the top-right wallet hub"}
          </div>
        </div>
        <div className="space-y-2 text-sm text-stone-300">
          <span>Submission rule</span>
          <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-300">
            Core signs once, sponsor covers gas, and any reward follows the payout address above.
          </div>
        </div>
      </div>
      <div className="mt-8 space-y-5">
        {questions.map((question, index) => {
          const selectedSingle = typeof answers[question.id] === "string" ? answers[question.id] as string : "";
          const selectedMany = Array.isArray(answers[question.id]) ? answers[question.id] as string[] : [];
          const isOtherSelected = question.type === "single_select"
            ? selectedSingle === OTHER_OPTION_VALUE
            : selectedMany.includes(OTHER_OPTION_VALUE);

          return (
            <div key={question.id} className="rounded-3xl border border-white/8 bg-black/10 p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-stone-500">Question {index + 1}</p>
              <p className="mt-2 text-lg font-medium text-white">{question.label}</p>
              {question.helperText ? <p className="mt-2 text-sm leading-6 text-stone-400">{question.helperText}</p> : null}

              {question.type === "rating" ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => updateAnswer(question.id, value)}
                      className={`rounded-full px-4 py-2 text-sm ${answers[question.id] === value ? "bg-lime-300 text-stone-900" : "border border-white/10 text-stone-200"}`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              ) : null}

              {question.type === "text" ? (
                <textarea
                  className="mt-4 min-h-28 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
                  placeholder={question.placeholder}
                  value={String(answers[question.id] ?? "")}
                  onChange={(event) => updateAnswer(question.id, event.target.value)}
                />
              ) : null}

              {(question.type === "single_select" || question.type === "multi_select") && question.options ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {question.options.map((option) => {
                    const active = question.type === "single_select" ? selectedSingle === option : selectedMany.includes(option);
                    return (
                      <button
                        key={option}
                        type="button"
                        className={`rounded-full px-4 py-2 text-sm ${active ? "bg-cyan-300 text-stone-900" : "border border-white/10 text-stone-200"}`}
                        onClick={() => {
                          if (question.type === "single_select") {
                            updateAnswer(question.id, option);
                            return;
                          }

                          toggleMultiSelect(question.id, option);
                        }}
                      >
                        {option}
                      </button>
                    );
                  })}
                  {question.allowOther ? (
                    <button
                      type="button"
                      className={`rounded-full px-4 py-2 text-sm ${isOtherSelected ? "bg-cyan-300 text-stone-900" : "border border-white/10 text-stone-200"}`}
                      onClick={() => {
                        if (question.type === "single_select") {
                          updateAnswer(question.id, OTHER_OPTION_VALUE);
                          return;
                        }

                        toggleMultiSelect(question.id, OTHER_OPTION_VALUE);
                      }}
                    >
                      Other
                    </button>
                  ) : null}
                </div>
              ) : null}

              {isOtherSelected ? (
                <input
                  className="mt-4 w-full rounded-2xl border border-cyan-300/15 bg-black/20 px-4 py-3 text-white outline-none"
                  placeholder="Type your custom answer"
                  value={otherAnswers[question.id] ?? ""}
                  onChange={(event) => setOtherAnswers((current) => ({ ...current, [question.id]: event.target.value }))}
                />
              ) : null}
            </div>
          );
        })}
      </div>
      <div className="mt-6 flex items-center gap-3"><button onClick={handleSubmit} disabled={isSubmitting} className="rounded-full bg-lime-300 px-5 py-3 text-sm font-semibold text-stone-900 disabled:opacity-60">{isSubmitting ? "Submitting..." : "Submit feedback"}</button><p className="text-sm text-stone-400">One submission per Core address. Rewards always follow the bound payout address.</p></div>
      {submitStage ? <p className="mt-3 text-sm text-cyan-200">{submitStage}</p> : null}
      {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
    </div>
  );
}
