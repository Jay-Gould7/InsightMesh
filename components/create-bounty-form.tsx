"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { AlertTriangle, Sparkles, X, Info, Rocket } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import GlareHover from "./reactbits/GlareHover";

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
  const [formError, setFormError] = useState("");
  const [launchError, setLaunchError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchStage, setLaunchStage] = useState("");
  const [pendingLaunch, setPendingLaunch] = useState<PendingLaunch | null>(null);
  const [showDraftTip, setShowDraftTip] = useState(true);

  const [lastBountyId, setLastBountyId] = useState<number | null>(null);
  // Correctly sync internal state when the pendingLaunch object changes to a different bounty
  if (pendingLaunch && pendingLaunch.bountyId !== lastBountyId) {
    setLastBountyId(pendingLaunch.bountyId);
    setShowDraftTip(true);
  }

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

    setFormError("");
    setLaunchError("");
    // Active prompt is guaranteed to be non-empty unless defaults change
    if (activePrompt.length < 2) {
      setFormError("Please enter an AI prompt (at least 2 characters).");
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
        setFormError(payload.error ?? "Unable to generate survey.");
        return;
      }

      markDraftDirty();
      setQuestions(sanitizeSurveyQuestions(payload.questions ?? []));
    } catch (generateError) {
      setFormError(generateError instanceof Error ? generateError.message : "Unable to generate survey.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleLaunch() {
    setFormError("");
    setLaunchError("");
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
      setLaunchError(`${message}${retryHint}`);
    } finally {
      setLaunchStage("");
      setIsLaunching(false);
    }
  }

  const previewQuestions = sanitizeSurveyQuestions(questions);
  const launchDisabled = isLaunching || questions.length < 3 || !coreAddress || !eSpaceAddress;

  const singleSelectCount = questions.filter((q) => isSelectQuestionType(q.type) && !q.allowOther).length;
  const multiSelectCount = questions.filter((q) => isSelectQuestionType(q.type) && q.allowOther).length;
  // Based on current logic "isSelectQuestionType" it returns true for multi-choice. The original types had radio/checkbox. Let's just calculate "Single" vs "Text" roughly.
  // We can just calculate exactly what was requested.
  const textInputCount = questions.filter((q) => q.type === "text").length;
  const selectCount = questions.filter((q) => isSelectQuestionType(q.type)).length;
  const ratingCount = questions.filter((q) => q.type === "rating").length;

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
            <input 
              className="w-full bg-white/[0.03] border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] backdrop-blur-md rounded-xl px-4 py-3 focus:bg-white/[0.05] focus:border-[#42D293]/50 focus:ring-1 focus:ring-[#42D293]/50 text-sm text-zinc-200 placeholder:text-zinc-500 transition-all outline-none" 
              placeholder={DEFAULT_TITLE} 
              value={title} 
              onChange={(event) => { markDraftDirty(); setTitle(event.target.value); }} 
            />
          </label>
          
          <label className="block">
            <span className="text-[10px] sm:text-xs font-bold tracking-widest text-zinc-500 uppercase mb-2 block">Description</span>
            <textarea 
              rows={3} 
              className="resize-none w-full bg-white/[0.03] border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] backdrop-blur-md rounded-xl px-4 py-3 focus:bg-white/[0.05] focus:border-[#42D293]/50 focus:ring-1 focus:ring-[#42D293]/50 text-sm text-zinc-200 placeholder:text-zinc-500 transition-all outline-none" 
              placeholder={DEFAULT_DESCRIPTION} 
              value={description} 
              onChange={(event) => { markDraftDirty(); setDescription(event.target.value); }} 
            />
          </label>
          
          <label className="block">
            <span className="text-[10px] sm:text-xs font-bold tracking-widest text-zinc-500 uppercase mb-2 block">AI prompt</span>
            <textarea 
              rows={3} 
              className="resize-none w-full bg-white/[0.03] border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] backdrop-blur-md rounded-xl px-4 py-3 focus:bg-white/[0.05] focus:border-[#42D293]/50 focus:ring-1 focus:ring-[#42D293]/50 text-sm text-zinc-200 placeholder:text-zinc-500 transition-all outline-none" 
              placeholder={DEFAULT_PROMPT} 
              value={prompt} 
              onChange={(event) => { markDraftDirty(); setPrompt(event.target.value); }} 
            />
          </label>

          <div className="grid grid-cols-10 gap-4">
            <label className="col-span-3 block">
              <span className="text-[10px] sm:text-xs font-bold tracking-widest text-zinc-500 uppercase mb-2 block">Count</span>
              <input
                type="number"
                min={3}
                max={8}
                className="w-full bg-white/[0.03] border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] backdrop-blur-md rounded-xl px-4 py-3 focus:bg-white/[0.05] focus:border-[#42D293]/50 focus:ring-1 focus:ring-[#42D293]/50 text-sm text-zinc-200 outline-none transition-all"
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
              <input 
                className="w-full bg-white/[0.03] border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] backdrop-blur-md rounded-xl px-4 py-3 focus:bg-white/[0.05] focus:border-[#42D293]/50 focus:ring-1 focus:ring-[#42D293]/50 text-sm text-zinc-200 transition-all outline-none" 
                value={rewardAmount} 
                onChange={(event) => { markDraftDirty(); setRewardAmount(event.target.value); }} 
              />
            </label>
            <label className="col-span-4 block">
              <span className="text-[10px] sm:text-xs font-bold tracking-widest text-zinc-500 uppercase mb-2 block">Deadline</span>
              <input 
                type="datetime-local" 
                className="w-full bg-white/[0.03] border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] backdrop-blur-md rounded-xl px-4 py-3 focus:bg-white/[0.05] focus:border-[#42D293]/50 focus:ring-1 focus:ring-[#42D293]/50 text-sm text-zinc-200 transition-all outline-none accent-[#42D293] cursor-pointer custom-datetime-picker" 
                value={deadline} 
                onChange={(event) => { markDraftDirty(); setDeadline(event.target.value); }} 
              />
            </label>
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-2 pt-6 relative">
          <AnimatePresence mode="popLayout">
            {/* 1. Pending Draft Tip (Dismissible) */}
            {pendingLaunch && showDraftTip && !launchStage && !formError && (
              <motion.div
                key="pending-draft"
                initial={{ opacity: 0, y: 12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96, y: 8 }}
                className="absolute bottom-[calc(100%+0.5rem)] left-0 right-0 z-20 flex items-start gap-3 rounded-2xl border border-white/10 bg-[#0c1410]/80 p-4 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.5)] backdrop-blur-2xl ring-1 ring-white/10"
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#42D293]/10 text-[#42D293]">
                  <Info className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 pr-6">
                  <p className="text-[13px] leading-relaxed font-medium text-zinc-100">
                    Draft <span className="text-[#42D293]">#{pendingLaunch.bountyId}</span> is staged. 
                  </p>
                  <p className="mt-0.5 text-[11px] text-zinc-400/90 leading-tight">
                    Retrying launch will intelligently skip already confirmed transactions.
                  </p>
                </div>
                <button 
                  onClick={() => setShowDraftTip(false)}
                  className="absolute right-3 top-3 h-6 w-6 flex items-center justify-center rounded-lg hover:bg-white/10 text-zinc-500 hover:text-white transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <div className="absolute -bottom-px left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-[#42D293]/50 to-transparent shadow-[0_0_10px_rgba(66,210,147,0.3)]" />
              </motion.div>
            )}

            {/* 2. Progress Indicator (Transient) */}
            {launchStage && (
              <motion.div
                key="launch-stage"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="absolute bottom-[calc(100%+0.5rem)] left-0 right-0 z-30 flex items-center gap-3 rounded-2xl border border-cyan-500/20 bg-cyan-950/20 p-4 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-400/20 text-cyan-400">
                  <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                </div>
                <p className="text-[13px] font-medium text-cyan-100/90 tracking-wide animate-pulse">
                  {launchStage}
                </p>
                {/* Active progress bar underneath */}
                <div className="absolute -bottom-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />
              </motion.div>
            )}

            {/* 3. Error Message (Urgent) */}
            {formError && (
              <motion.div
                key="form-error"
                initial={{ opacity: 0, y: 12, rotateX: -10 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute bottom-[calc(100%+0.5rem)] left-0 right-0 z-40 flex items-start gap-3 rounded-2xl border border-rose-500/20 bg-[#1a0c0e]/80 p-4 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.6)] backdrop-blur-2xl ring-1 ring-rose-500/10"
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-500/20 text-rose-400">
                  <AlertTriangle className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 pr-6">
                  <p className="text-[13px] font-semibold text-rose-100">Launch Interrupted</p>
                  <p className="mt-0.5 text-[11px] text-rose-300/80 leading-snug">{formError}</p>
                </div>
                <button 
                  onClick={() => setFormError("")}
                  className="absolute right-3 top-3 h-6 w-6 flex items-center justify-center rounded-lg hover:bg-rose-500/10 text-rose-500/60 hover:text-rose-400 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <div className="absolute -bottom-px left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-rose-500/60 to-transparent" />
              </motion.div>
            )}
          </AnimatePresence>


          <div className="flex gap-4">
            <GlareHover
              width="100%"
              height="58px"
              background="linear-gradient(135deg, rgba(255,255,255,0.04), rgba(66,210,147,0.08))"
              borderRadius="18px"
              borderColor="rgba(255, 255, 255, 0.14)"
              glareColor="#42D293"
              glareOpacity={0.2}
              glareSize={320}
              className={`group flex-1 border shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_18px_30px_rgba(0,0,0,0.18)] transition-all duration-300 ${isGenerating ? "pointer-events-none opacity-50 saturate-50" : "hover:-translate-y-0.5 hover:border-[#42D293]/60 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_24px_40px_rgba(61,195,137,0.14)] active:translate-y-0 active:scale-[0.985]"}`}
              onClick={handleGenerate}
            >
              <div className="pointer-events-none flex w-full items-center justify-center gap-3 px-5 text-sm font-semibold text-zinc-100">
                <Sparkles className={`h-5 w-5 text-[#8df2bf] ${isGenerating ? "animate-spin" : "transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110"}`} />
                <span className="text-base font-semibold text-zinc-100">{isGenerating ? "Crafting..." : "Generate AI"}</span>
              </div>
            </GlareHover>
            <button
              onClick={handleLaunch}
              disabled={launchDisabled}
              className="group relative flex min-h-[58px] flex-1 items-center justify-center overflow-hidden rounded-[18px] border border-[#7bf1b8]/25 bg-[linear-gradient(135deg,#58efaa_0%,#42D293_42%,#1e7c59_100%)] px-5 py-3.5 text-sm font-black text-[#04120b] shadow-[0_18px_36px_rgba(66,210,147,0.28),inset_0_1px_0_rgba(255,255,255,0.28)] transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7bf1b8]/40 disabled:cursor-not-allowed disabled:border-[#42D293]/10 disabled:bg-[linear-gradient(135deg,rgba(88,239,170,0.45)_0%,rgba(66,210,147,0.5)_42%,rgba(30,124,89,0.4)_100%)] disabled:text-[#04120b]/55 disabled:shadow-none disabled:saturate-75 disabled:hover:translate-y-0 disabled:hover:shadow-none hover:-translate-y-0.5 hover:shadow-[0_24px_46px_rgba(66,210,147,0.34),inset_0_1px_0_rgba(255,255,255,0.34)] active:translate-y-0 active:scale-[0.985]"
            >
              <span className="pointer-events-none absolute inset-x-5 top-0 h-px bg-white/40 opacity-80" />
              <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.24),transparent_48%)] opacity-70 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="relative flex items-center justify-center gap-2.5">
                <Rocket className={`h-5 w-5 ${isLaunching ? "animate-pulse opacity-70" : "transition-transform duration-500 group-hover:translate-x-1 group-hover:-translate-y-1"}`} />
                <span className="text-base font-black tracking-tight">{isLaunching ? "Publishing..." : "Launch"}</span>
              </div>
            </button>
          </div>
          {(!coreAddress || !eSpaceAddress) && (
            <p className="text-center text-xs text-rose-400/80">Connect both Core & eSpace wallets in the hub missing top to enable launch.</p>
          )}
        </div>
      </div>

      {/* RIGHT PANE */}
      <div className="w-1/2 pl-8 pb-32 flex flex-col gap-6">
        <div className="flex items-center gap-5 px-1 py-2 text-[#42D293] font-bold shrink-0 transition-all duration-500">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#42D293]/10 text-[#42D293] shadow-[0_0_10px_rgba(66,210,147,0.1)]">
            <Sparkles className={`h-4.5 w-4.5 ${isGenerating ? 'animate-spin' : 'animate-pulse'}`} />
          </div>
          <div className="flex-1">
            {isGenerating ? (
              <span className="animate-pulse flex items-center gap-2 text-[#42D293]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#42D293] shadow-[0_0_8px_#42D293]" />
                AI is crafting your survey questions...
              </span>
            ) : questions.length > 0 ? (
              <div className="flex items-center gap-4">
                <span className="text-[14px] font-black uppercase tracking-[0.05em] text-[#42D293]">
                  {questions.length} Questions Generated
                </span>
                <span className="text-zinc-500 font-medium text-[12px] flex items-center gap-2">
                  <span className="h-[3px] w-[3px] rounded-full bg-zinc-700" />
                  <span>
                    {[
                      selectCount > 0 && `${selectCount} Select`,
                      textInputCount > 0 && `${textInputCount} Text`,
                      ratingCount > 0 && `${ratingCount} Rating`
                    ].filter(Boolean).join(" · ")}
                  </span>
                </span>
              </div>
            ) : (
              <span className="opacity-60 font-medium text-zinc-500 italic text-sm">Ready to generate survey questions with AI.</span>
            )}
          </div>
        </div>

        <SurveyBuilder questions={questions} setQuestions={updateQuestions} />
      </div>
    </div>
      {launchError ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg overflow-hidden rounded-[28px] border border-rose-400/18 bg-[linear-gradient(180deg,rgba(28,12,14,0.98),rgba(10,10,10,0.98))] p-6 shadow-[0_28px_80px_rgba(0,0,0,0.45)]">
            <button
              type="button"
              onClick={() => setLaunchError("")}
              className="absolute right-4 top-4 rounded-full border border-white/10 bg-white/5 p-2 text-zinc-400 transition-colors hover:border-white/15 hover:text-white"
              aria-label="Close error dialog"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-rose-400/18 bg-rose-500/12 text-rose-300">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="pr-8">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rose-300/75">Publish Failed</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">The bounty was not published.</h3>
                <p className="mt-3 text-sm leading-7 text-zinc-300">{launchError}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setLaunchError("")}
                className="rounded-full border border-white/12 bg-white/6 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:border-white/20 hover:bg-white/10"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
