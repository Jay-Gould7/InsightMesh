"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

import { SurveyBuilder } from "@/components/survey-builder";
import { useESpaceWallet } from "@/components/providers/espace-provider";
import { useFluentWallet } from "@/components/providers/fluent-provider";
import { createBountyOnCore } from "@/lib/conflux/browser-core";
import { approveAndDepositRewardPool } from "@/lib/conflux/browser-espace";
import { fakeBrowserTxHash } from "@/lib/demo-browser";
import { canonicalJson, hashContent } from "@/lib/hash";
import { formatQuestionTypeLabel, sanitizeSurveyQuestions, validateSurveyQuestions } from "@/lib/survey";
import type { BountyFundingConfig, CoreSpaceConfig, SurveyQuestion } from "@/lib/types";
import { truncateAddress } from "@/lib/utils";

const truthy = new Set(["1", "true", "yes", "on"]);
const demoMode = truthy.has((process.env.NEXT_PUBLIC_DEMO_MODE ?? "true").toLowerCase());

type PendingLaunch = {
  bountyId: number;
  creatorCoreAddress: string;
  creatorEspaceAddress: string;
  title: string;
  description: string;
  prompt: string;
  rewardAmount: string;
  deadline: string;
  questions: SurveyQuestion[];
  funding: BountyFundingConfig;
  core: CoreSpaceConfig;
  depositTxHash?: string;
  coreCreateTxHash?: string;
};

export function CreateBountyForm() {
  const router = useRouter();
  const { address: coreAddress } = useFluentWallet();
  const { address: eSpaceAddress } = useESpaceWallet();
  const [title, setTitle] = useState("Wallet Growth Sprint Feedback");
  const [description, setDescription] = useState("We are collecting sharp, high-signal community feedback to decide the next wallet roadmap bet.");
  const [prompt, setPrompt] = useState("What would make a Conflux wallet feel dramatically better for power users and first-time users?");
  const [questionCount, setQuestionCount] = useState(4);
  const [rewardAmount, setRewardAmount] = useState("100.00");
  const [deadline, setDeadline] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16));
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchStage, setLaunchStage] = useState("");
  const [pendingLaunch, setPendingLaunch] = useState<PendingLaunch | null>(null);

  function markDraftDirty() {
    setPendingLaunch((current) => {
      if (!current || current.depositTxHash || current.coreCreateTxHash) {
        return current;
      }

      return null;
    });
  }

  function updateQuestions(nextQuestions: SurveyQuestion[] | ((current: SurveyQuestion[]) => SurveyQuestion[])) {
    markDraftDirty();
    setQuestions(nextQuestions);
  }

  async function handleGenerate() {
    setError("");
    setIsGenerating(true);
    const response = await fetch("/api/ai/generate-survey", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, prompt, questionCount }),
    });
    const payload = await response.json();
    setIsGenerating(false);
    if (!response.ok) {
      setError(payload.error ?? "Unable to generate survey.");
      return;
    }

    markDraftDirty();
    setQuestions(sanitizeSurveyQuestions(payload.questions ?? []));
  }

  async function handleLaunch() {
    setError("");
    setIsLaunching(true);
    let currentLaunch = pendingLaunch;

    try {
      const normalizedQuestions = sanitizeSurveyQuestions(questions);
      const questionError = validateSurveyQuestions(normalizedQuestions);
      if (questionError) {
        throw new Error(questionError);
      }

      setQuestions(normalizedQuestions);

      if (!coreAddress || !eSpaceAddress) {
        throw new Error("Connect both the Core wallet and the eSpace wallet before publishing.");
      }

      if (!currentLaunch) {
        setLaunchStage("Saving the draft bounty...");
        const response = await fetch("/api/bounty", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description,
            prompt,
            rewardAmount,
            deadline: new Date(deadline).toISOString(),
            creatorCoreAddress: coreAddress,
            creatorEspaceAddress: eSpaceAddress,
            questions: normalizedQuestions,
          }),
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error ?? "Unable to create the draft bounty.");
        }

        currentLaunch = {
          bountyId: payload.bounty.id,
          creatorCoreAddress: coreAddress,
          creatorEspaceAddress: eSpaceAddress,
          title,
          description,
          prompt,
          rewardAmount,
          deadline,
          questions: normalizedQuestions,
          funding: payload.funding,
          core: payload.core,
        };
        setPendingLaunch(currentLaunch);
      }

      if (!currentLaunch.depositTxHash) {
        if (currentLaunch.funding.mode === "demo" || demoMode) {
          setLaunchStage("Simulating reward lock in demo mode...");
          currentLaunch = {
            ...currentLaunch,
            depositTxHash: fakeBrowserTxHash(),
          };
        } else {
          if (!currentLaunch.funding.rewardVaultAddress || !currentLaunch.funding.usdt0Address) {
            throw new Error("Reward vault configuration is missing on the server.");
          }

          setLaunchStage("Approve USDT0, then confirm the deposit from your eSpace wallet...");
          const { depositTxHash } = await approveAndDepositRewardPool({
            bountyId: currentLaunch.bountyId,
            creatorEspaceAddress: currentLaunch.creatorEspaceAddress,
            rewardAmount: currentLaunch.rewardAmount,
            funding: currentLaunch.funding,
          });
          currentLaunch = {
            ...currentLaunch,
            depositTxHash,
          };
        }

        setPendingLaunch(currentLaunch);
      }

      if (!currentLaunch.coreCreateTxHash) {
        if (currentLaunch.core.mode === "demo" || demoMode) {
          setLaunchStage("Simulating Core bounty creation in demo mode...");
          currentLaunch = {
            ...currentLaunch,
            coreCreateTxHash: fakeBrowserTxHash(),
          };
        } else {
          if (!currentLaunch.core.bountyRegistryAddress) {
            throw new Error("Core registry configuration is missing on the server.");
          }

          const metadataHash = hashContent(canonicalJson({
            title: currentLaunch.title,
            description: currentLaunch.description,
            prompt: currentLaunch.prompt,
            questions: currentLaunch.questions,
          }));

          setLaunchStage("Confirm the Core Space create transaction in Fluent...");
          const { coreCreateTxHash } = await createBountyOnCore({
            chainBountyId: currentLaunch.bountyId,
            creatorCoreAddress: currentLaunch.creatorCoreAddress,
            title: currentLaunch.title,
            metadataHash,
            rewardAmount: currentLaunch.rewardAmount,
            deadline: new Date(currentLaunch.deadline),
            core: currentLaunch.core,
          });
          currentLaunch = {
            ...currentLaunch,
            coreCreateTxHash,
          };
        }

        setPendingLaunch(currentLaunch);
      }

      setLaunchStage("Verifying the deposit and Core create transactions...");
      const activateResponse = await fetch(`/api/bounty/${currentLaunch.bountyId}/activate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          depositTxHash: currentLaunch.depositTxHash,
          coreCreateTxHash: currentLaunch.coreCreateTxHash,
        }),
      });
      const activatePayload = await activateResponse.json();
      if (!activateResponse.ok) {
        throw new Error(activatePayload.error ?? "Unable to publish the bounty after funding.");
      }

      setPendingLaunch(null);
      startTransition(() => {
        router.push(`/bounty/${activatePayload.bounty.id}`);
        router.refresh();
      });
    } catch (launchError) {
      const message = launchError instanceof Error ? launchError.message : "Unable to launch bounty.";
      const retryHint =
        currentLaunch?.coreCreateTxHash
          ? ` Draft #${currentLaunch.bountyId} already has both wallet transactions, so you can retry publish without re-signing anything.`
          : currentLaunch?.depositTxHash
            ? ` Draft #${currentLaunch.bountyId} is already funded, so you can retry publish without depositing again.`
            : currentLaunch
              ? ` Draft #${currentLaunch.bountyId} is saved.`
              : "";
      setError(`${message}${retryHint}`);
    } finally {
      setLaunchStage("");
      setIsLaunching(false);
    }
  }

  const previewQuestions = sanitizeSurveyQuestions(questions);

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="space-y-5 rounded-[2rem] border border-white/10 bg-white/6 p-6 backdrop-blur-xl">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-lime-300/70">Launch flow</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Fund a bounty and publish the survey</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-300">InsightMesh now creates a draft, asks your eSpace wallet to lock `USDT0`, then asks your Core wallet to publish the bounty onchain.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 text-sm text-stone-300">
            <span>Connected Core creator</span>
            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white">
              {coreAddress ? truncateAddress(coreAddress, 10) : "Connect Core in the top-right wallet hub"}
            </div>
          </div>
          <div className="space-y-2 text-sm text-stone-300">
            <span>Connected eSpace payout owner</span>
            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white">
              {eSpaceAddress ? truncateAddress(eSpaceAddress, 10) : "Connect eSpace in the top-right wallet hub"}
            </div>
          </div>
        </div>
        <label className="block space-y-2 text-sm text-stone-300">
          <span>Title</span>
          <input className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none" value={title} onChange={(event) => { markDraftDirty(); setTitle(event.target.value); }} />
        </label>
        <label className="block space-y-2 text-sm text-stone-300">
          <span>Description</span>
          <textarea className="min-h-32 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none" value={description} onChange={(event) => { markDraftDirty(); setDescription(event.target.value); }} />
        </label>
        <label className="block space-y-2 text-sm text-stone-300">
          <span>AI prompt</span>
          <textarea className="min-h-28 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none" value={prompt} onChange={(event) => { markDraftDirty(); setPrompt(event.target.value); }} />
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm text-stone-300">
            <span>AI question count</span>
            <input
              type="number"
              min={3}
              max={8}
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
              value={questionCount}
              onChange={(event) => {
                markDraftDirty();
                const parsed = Number.parseInt(event.target.value, 10);
                setQuestionCount(Number.isFinite(parsed) ? Math.min(8, Math.max(3, parsed)) : 4);
              }}
            />
          </label>
          <label className="space-y-2 text-sm text-stone-300">
            <span>Reward amount</span>
            <input className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none" value={rewardAmount} onChange={(event) => { markDraftDirty(); setRewardAmount(event.target.value); }} />
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm text-stone-300">
            <span>Deadline</span>
            <input type="datetime-local" className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none" value={deadline} onChange={(event) => { markDraftDirty(); setDeadline(event.target.value); }} />
          </label>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={handleGenerate} disabled={isGenerating} className="rounded-full bg-lime-300 px-5 py-3 text-sm font-semibold text-stone-900 disabled:opacity-60">{isGenerating ? "Generating..." : `Generate ${questionCount} questions`}</button>
          <button onClick={handleLaunch} disabled={isLaunching || questions.length < 3 || !coreAddress || !eSpaceAddress} className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{isLaunching ? "Funding + publishing..." : "Deposit, create, and publish"}</button>
        </div>
        <SurveyBuilder questions={questions} setQuestions={updateQuestions} />
        {launchStage ? <p className="text-sm text-cyan-200">{launchStage}</p> : null}
        {pendingLaunch ? <p className="text-sm text-stone-400">Draft #{pendingLaunch.bountyId} is staged for launch. If publish fails after either wallet transaction, clicking the launch button again will reuse the transactions that already succeeded.</p> : null}
        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      </section>
      <aside className="space-y-4 rounded-[2rem] border border-white/10 bg-black/20 p-6 backdrop-blur-xl">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-lime-300/70">Survey preview</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Questions that will be published</h2>
        </div>
        <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/5 p-4 text-sm text-cyan-50">
          {"Launch sequence: save draft -> approve USDT0 -> deposit into RewardVault -> createBounty on Core -> backend verifies both txs."}
        </div>
        <div className="space-y-3">
          {previewQuestions.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-stone-400">Generate the survey first, or build it manually. Publishing stays locked until there are at least 3 valid questions.</p>
          ) : (
            previewQuestions.map((question, index) => (
              <div key={question.id} className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-stone-500">Q{index + 1} · {formatQuestionTypeLabel(question.type)}</p>
                <p className="mt-2 font-medium text-white">{question.label || "Untitled question"}</p>
                {question.helperText ? <p className="mt-2 text-sm text-stone-400">{question.helperText}</p> : null}
                {question.options?.length ? <p className="mt-2 text-sm text-stone-400">{[...question.options, ...(question.allowOther ? ["Other"] : [])].join(" · ")}</p> : null}
                {question.type === "text" && question.placeholder ? <p className="mt-2 text-sm text-stone-500">Placeholder: {question.placeholder}</p> : null}
              </div>
            ))
          )}
        </div>
      </aside>
    </div>
  );
}

