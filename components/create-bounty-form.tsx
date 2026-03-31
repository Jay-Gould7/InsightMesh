"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { Sparkles } from "lucide-react";

import { SurveyBuilder } from "@/components/survey-builder";
import LightRays from "@/components/reactbits/LightRays";
import { useESpaceWallet } from "@/components/providers/espace-provider";
import { useFluentWallet } from "@/components/providers/fluent-provider";
import { createBountyOnCore } from "@/lib/conflux/browser-core";
import { approveAndDepositRewardPool } from "@/lib/conflux/browser-espace";
import { fakeBrowserTxHash } from "@/lib/demo-browser";
import { canonicalJson, hashContent } from "@/lib/hash";
import { formatQuestionTypeLabel, sanitizeSurveyQuestions, validateSurveyQuestions, isSelectQuestionType } from "@/lib/survey";
import type { BountyFundingConfig, CoreSpaceConfig, SurveyQuestion } from "@/lib/types";
import { truncateAddress } from "@/lib/utils";

const truthy = new Set(["1", "true", "yes", "on"]);
const demoMode = truthy.has((process.env.NEXT_PUBLIC_DEMO_MODE ?? "true").toLowerCase());

const DEFAULT_TITLE = "Wallet Growth Sprint Feedback";
const DEFAULT_DESCRIPTION = "We are collecting sharp, high-signal community feedback to decide the next wallet roadmap bet.";
const DEFAULT_PROMPT = "What would make a Conflux wallet feel dramatically better for power users and first-time users?";

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
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [prompt, setPrompt] = useState("");
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
    const activeTitle = title.trim() || DEFAULT_TITLE;
    const activeDescription = description.trim() || DEFAULT_DESCRIPTION;
    const activePrompt = prompt.trim() || DEFAULT_PROMPT;

    setError("");
    // Active prompt is guaranteed to be non-empty unless defaults change
    if (activePrompt.length < 2) {
      setError("Please enter an AI prompt (at least 2 characters).");
      return;
    }
    setIsGenerating(true);
    try {
      const response = await fetch("/api/ai/generate-survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: activeTitle || undefined, description: activeDescription || undefined, prompt: activePrompt, questionCount }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "Unable to generate survey.");
        return;
      }

      markDraftDirty();
      setQuestions(sanitizeSurveyQuestions(payload.questions ?? []));
    } catch (generateError) {
      setError(generateError instanceof Error ? generateError.message : "Unable to generate survey.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleLaunch() {
    setError("");
    setIsLaunching(true);
    let currentLaunch = pendingLaunch;

    const activeTitle = title.trim() || DEFAULT_TITLE;
    const activeDescription = description.trim() || DEFAULT_DESCRIPTION;
    const activePrompt = prompt.trim() || DEFAULT_PROMPT;

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
            title: activeTitle,
            description: activeDescription,
            prompt: activePrompt,
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
          title: activeTitle,
          description: activeDescription,
          prompt: activePrompt,
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

  const singleSelectCount = questions.filter((q) => isSelectQuestionType(q.type) && !q.allowOther).length;
  const multiSelectCount = questions.filter((q) => isSelectQuestionType(q.type) && q.allowOther).length;
  // Based on current logic "isSelectQuestionType" it returns true for multi-choice. The original types had radio/checkbox. Let's just calculate "Single" vs "Text" roughly.
  // We can just calculate exactly what was requested.
  const textInputCount = questions.filter((q) => q.type === "text").length;
  const selectCount = questions.filter((q) => isSelectQuestionType(q.type)).length;

  return (
    <>
      <div className="fixed top-0 left-0 w-full h-[100vh] z-0 pointer-events-none">
        <LightRays
          raysOrigin="top-center"
          raysColor="#3dc389"
          raysSpeed={1.5}
          lightSpread={0.5}
          rayLength={3}
          followMouse={true}
          mouseInfluence={0.1}
          noiseAmount={0.1}
          distortion={0}
          className="custom-rays opacity-40"
          pulsating={false}
          fadeDistance={2}
          saturation={1}
        />
      </div>
      <div className="flex max-w-[1600px] mx-auto items-start relative z-10">
        {/* Ambient Background Glow */}
        <div className="absolute top-0 left-[10%] w-[500px] h-[500px] bg-[#42D293]/5 rounded-full blur-[120px] pointer-events-none z-[-1]" />
        <div className="absolute bottom-[10%] right-[10%] w-[600px] h-[600px] bg-[#00F0FF]/5 rounded-full blur-[150px] pointer-events-none z-[-1]" />
        {/* LEFT PANE */}
      <div className="w-1/2 sticky top-24 h-[calc(100vh-8.5rem)] pr-8 border-r border-white/10 flex flex-col">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Create Bounty Survey</h1>
        
        <div className="flex mt-3 mb-3 gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono text-zinc-400 tracking-wide">
            <div className={`w-1.5 h-1.5 rounded-full ${coreAddress ? 'bg-[#42D293] shadow-[0_0_5px_#42D293] animate-pulse' : 'bg-red-500 shadow-[0_0_5px_red] opacity-50'}`} />
            {coreAddress ? `Core: ${truncateAddress(coreAddress)}` : "Core: Pending"}
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono text-zinc-400 tracking-wide">
            <div className={`w-1.5 h-1.5 rounded-full ${eSpaceAddress ? 'bg-[#42D293] shadow-[0_0_5px_#42D293] animate-pulse' : 'bg-red-500 shadow-[0_0_5px_red] opacity-50'}`} />
            {eSpaceAddress ? `eSpace: ${truncateAddress(eSpaceAddress)}` : "eSpace: Pending"}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <label className="block">
            <span className="text-[10px] sm:text-xs font-bold tracking-widest text-zinc-500 uppercase mb-2 block">Title</span>
            <input className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 focus:border-[#42D293] focus:ring-1 focus:ring-[#42D293] text-sm text-zinc-200 placeholder:text-zinc-600 transition-all outline-none" placeholder={DEFAULT_TITLE} value={title} onChange={(event) => { markDraftDirty(); setTitle(event.target.value); }} />
          </label>
          
          <label className="block">
            <span className="text-[10px] sm:text-xs font-bold tracking-widest text-zinc-500 uppercase mb-2 block">Description</span>
            <textarea rows={3} className="resize-none w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 focus:border-[#42D293] focus:ring-1 focus:ring-[#42D293] text-sm text-zinc-200 placeholder:text-zinc-600 transition-all outline-none" placeholder={DEFAULT_DESCRIPTION} value={description} onChange={(event) => { markDraftDirty(); setDescription(event.target.value); }} />
          </label>
          
          <label className="block">
            <span className="text-[10px] sm:text-xs font-bold tracking-widest text-zinc-500 uppercase mb-2 block">AI prompt</span>
            <textarea rows={3} className="resize-none w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 focus:border-[#42D293] focus:ring-1 focus:ring-[#42D293] text-sm text-zinc-200 placeholder:text-zinc-600 transition-all outline-none" placeholder={DEFAULT_PROMPT} value={prompt} onChange={(event) => { markDraftDirty(); setPrompt(event.target.value); }} />
          </label>

          <div className="grid grid-cols-10 gap-4">
            <label className="col-span-3 block">
              <span className="text-[10px] sm:text-xs font-bold tracking-widest text-zinc-500 uppercase mb-2 block">Count</span>
              <input
                type="number"
                min={3}
                max={8}
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 focus:border-[#42D293] focus:ring-1 focus:ring-[#42D293] text-sm text-zinc-200 transition-all outline-none"
                value={questionCount}
                onChange={(event) => {
                  markDraftDirty();
                  const parsed = Number.parseInt(event.target.value, 10);
                  setQuestionCount(Number.isFinite(parsed) ? Math.min(8, Math.max(3, parsed)) : 4);
                }}
              />
            </label>
            <label className="col-span-3 block">
              <span className="text-[10px] sm:text-xs font-bold tracking-widest text-zinc-500 uppercase mb-2 block">Reward</span>
              <input className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 focus:border-[#42D293] focus:ring-1 focus:ring-[#42D293] text-sm text-zinc-200 transition-all outline-none" value={rewardAmount} onChange={(event) => { markDraftDirty(); setRewardAmount(event.target.value); }} />
            </label>
            <label className="col-span-4 block">
              <span className="text-[10px] sm:text-xs font-bold tracking-widest text-zinc-500 uppercase mb-2 block">Deadline</span>
              <input 
                type="datetime-local" 
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 focus:border-[#42D293] focus:ring-1 focus:ring-[#42D293] text-sm text-zinc-200 transition-all outline-none accent-[#42D293] cursor-pointer custom-datetime-picker" 
                value={deadline} 
                onChange={(event) => { markDraftDirty(); setDeadline(event.target.value); }} 
              />
            </label>
          </div>
        </div>

        {launchStage ? <p className="mt-4 text-sm text-cyan-400">{launchStage}</p> : null}
        {pendingLaunch ? <p className="mt-4 text-sm text-zinc-500 bg-zinc-900/50 border border-zinc-800 p-3 rounded-lg">Draft #{pendingLaunch.bountyId} is staged. Retrying launch will skip already confirmed transactions.</p> : null}
        {error ? <p className="mt-4 text-sm text-rose-400">{error}</p> : null}

        <div className="mt-auto flex flex-col gap-2 pt-6">
          <div className="flex gap-4">
            <button onClick={handleGenerate} disabled={isGenerating} className="flex-1 flex justify-center items-center rounded-xl border border-zinc-700 hover:border-[#42D293] hover:text-[#42D293] bg-zinc-900/50 hover:bg-[#42D293]/10 transition-all duration-300 shadow-sm px-5 py-3.5 text-sm font-semibold text-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#42D293]/50 disabled:opacity-50 min-h-[50px]">
              <Sparkles className="w-4 h-4 mr-2" />
              {isGenerating ? "Generating..." : "Generate AI"}
            </button>
            <button onClick={handleLaunch} disabled={isLaunching || questions.length < 3 || !coreAddress || !eSpaceAddress} className="flex-1 rounded-xl bg-[#42D293] px-5 py-3.5 text-sm text-black font-extrabold hover:bg-[#34b87e] transition-colors shadow-[0_0_20px_rgba(66,210,147,0.4)] focus:outline-none focus:ring-2 focus:ring-[#42D293]/50 disabled:opacity-50 disabled:bg-[#42D293]/50 disabled:shadow-none min-h-[50px]">
              {isLaunching ? "Publishing..." : "Launch"}
            </button>
          </div>
          {(!coreAddress || !eSpaceAddress) && (
            <p className="text-center text-xs text-rose-400/80">Connect both Core & eSpace wallets in the hub missing top to enable launch.</p>
          )}
        </div>
      </div>

      {/* RIGHT PANE */}
      <div className="w-1/2 pl-8 pb-32 flex flex-col gap-6">
        <div className="bg-[#42D293]/10 border border-[#42D293]/30 shadow-[0_0_15px_rgba(66,210,147,0.1)] rounded-xl p-4 flex items-center gap-3 text-[#42D293] text-sm font-bold shrink-0 transition-all duration-300">
          <Sparkles className={`h-5 w-5 shrink-0 ${isGenerating ? 'animate-spin' : ''}`} />
          {isGenerating ? (
            <span className="animate-pulse">✨ AI is crafting your survey questions...</span>
          ) : questions.length > 0 ? (
            <span>✨ {questions.length} Questions Generated ({selectCount} Select, {textInputCount} Text)</span>
          ) : (
            <span className="opacity-60 font-medium">✨ Ready to generate survey questions with AI.</span>
          )}
        </div>

        <SurveyBuilder questions={questions} setQuestions={updateQuestions} />
      </div>
      </div>
    </>
  );
}

