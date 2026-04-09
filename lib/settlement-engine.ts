import { buildScoreBreakdown, type SubmissionForScoring } from "@/lib/ai/scorer";
import { requestGeminiJson } from "@/lib/ai/client";
import { getESpacePublicClient } from "@/lib/conflux/espace-client";
import type { AnalysisCluster, InsightHighlight, ScoreBreakdownEntry } from "@/lib/types";
import { getAddress, isAddress, type Address } from "viem";

const DISCOVERY_BONUS_POINTS = 12;
const AI_RETRY_MESSAGE = "AI analysis failed. Please retry.";

export type SettlementEngineInput = {
  title: string;
  prompt: string;
  totalUsdtReward: number | string;
  submissions: Array<{
    id: number;
    walletAddress: string;
    submitterCoreAddress: string;
    content: string;
    submittedAt: string | Date;
  }>;
};

type NormalizedSubmission = {
  id: number;
  walletAddress: string;
  submitterCoreAddress: string;
  content: string;
  submittedAt: Date;
};

type GeminiEvaluation = {
  submissionId: number;
  qualityRating: number;
  isBotFarm: boolean;
  clusterId: string;
};

type GeminiClusterNarrative = {
  clusterId: string;
  theme: string;
  summary: string;
  highlightTitle?: string;
  highlightReason?: string;
};

type DisqualificationReason =
  | "duplicate_wallet_address"
  | "bot_farm"
  | "new_wallet_nonce_zero"
  | "invalid_wallet_address";

export type DisqualifiedSubmission = {
  submissionId: number;
  walletAddress: string;
  reason: DisqualificationReason;
};

export type SettlementEngineResult = {
  clusters: AnalysisCluster[];
  duplicates: number[][];
  highlights: InsightHighlight[];
  qualityRatings: Record<number, number>;
  scoreBreakdown: ScoreBreakdownEntry[];
  recipients: string[];
  rewardAmounts: string[];
  totalPoints: number;
  eligibleSubmissionIds: number[];
  disqualified: DisqualifiedSubmission[];
};

const GEMINI_SYSTEM_INSTRUCTION = `
You are the anti-Sybil settlement evaluator for a Web3 bounty system.
You will receive a bounty title, prompt, and a list of submissions.

Return a top-level JSON array.
Each object in the array must include:
- submissionId: number
- qualityRating: integer from 1 to 5
- isBotFarm: boolean
- clusterId: short kebab-case string grouping similar ideas

Mark isBotFarm=true when the submission looks like mass-generated spam, templated farming, meaningless filler, obvious copy-paste abuse, or low-signal synthetic content.
Every submission must appear exactly once in the array.
Do not include markdown or code fences.
`.trim();

const GEMINI_CLUSTER_NARRATIVE_INSTRUCTION = `
You are writing polished community insight summaries for a Web3 bounty dashboard.
You will receive a bounty title, prompt, and a list of clusters. Each cluster includes:
- clusterId
- submissionCount
- representative submission texts
- earliest submission text

Return a top-level JSON array.
Each object must include:
- clusterId: string
- theme: short natural-language cluster title
- summary: 1-2 sentence human-readable summary, max 180 chars
- highlightTitle: short title for the best highlighted insight in this cluster
- highlightReason: short reason explaining why the highlighted submission matters

Important:
- Write in the same language as the bounty prompt/title and the dominant submission language.
- If the input is Chinese, output Chinese.
- If the input is English, output English.
- Do not use placeholder wording or generic labels like "General Feedback" unless truly necessary.
- Do not include markdown or code fences.
`.trim();

function failAiAnalysis(): never {
  throw new Error(AI_RETRY_MESSAGE);
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sanitizeClusterId(value: string | undefined, fallback: string) {
  const normalized = String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || fallback;
}

function truncateText(value: string, limit: number) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= limit) {
    return normalized;
  }

  return `${normalized.slice(0, limit).trimEnd()}...`;
}

function toRewardPoolString(value: number | string) {
  if (typeof value === "number") {
    return value.toFixed(2);
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric.toFixed(2) : "0.00";
}

function normalizeSubmittedAt(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date : new Date(0);
}

function compareBySubmittedAt(left: NormalizedSubmission, right: NormalizedSubmission) {
  const timeDelta = left.submittedAt.getTime() - right.submittedAt.getTime();
  if (timeDelta !== 0) {
    return timeDelta;
  }

  return left.id - right.id;
}

async function evaluateSubmissionsWithGemini(
  title: string,
  prompt: string,
  submissions: NormalizedSubmission[],
) {
  const evaluations = await requestGeminiJson<GeminiEvaluation[]>(
    GEMINI_SYSTEM_INSTRUCTION,
    JSON.stringify({
      title,
      prompt,
      submissions: submissions.map((submission) => ({
        id: submission.id,
        walletAddress: submission.walletAddress,
        content: submission.content,
        submittedAt: submission.submittedAt.toISOString(),
      })),
    }),
  );

  const sanitized = (evaluations ?? []).filter(
    (item) =>
      typeof item?.submissionId === "number" &&
      typeof item?.clusterId === "string",
  );

  if (sanitized.length !== submissions.length) {
    failAiAnalysis();
  }

  return sanitized;
}

async function generateClusterNarratives(
  title: string,
  prompt: string,
  clusters: Array<{
    clusterId: string;
    submissionCount: number;
    earliestSubmission: string;
    representativeTexts: string[];
  }>,
) {
  if (clusters.length === 0) {
    return [] as GeminiClusterNarrative[];
  }

  const narratives = await requestGeminiJson<GeminiClusterNarrative[]>(
    GEMINI_CLUSTER_NARRATIVE_INSTRUCTION,
    JSON.stringify({
      title,
      prompt,
      clusters,
    }),
  );

  const sanitized = (narratives ?? []).filter(
    (item) =>
      typeof item?.clusterId === "string" &&
      typeof item?.theme === "string" &&
      typeof item?.summary === "string",
  );

  if (sanitized.length !== clusters.length) {
    failAiAnalysis();
  }

  return sanitized.map((item) => ({
    clusterId: sanitizeClusterId(item.clusterId, item.clusterId),
    theme: item.theme.trim(),
    summary: truncateText(item.summary.trim(), 180),
    highlightTitle: item.highlightTitle?.trim(),
    highlightReason: item.highlightReason?.trim(),
  }));
}

function sanitizeEvaluations(
  submissions: NormalizedSubmission[],
  evaluations: GeminiEvaluation[],
) {
  const bySubmissionId = new Map<number, GeminiEvaluation>();

  for (const evaluation of evaluations) {
    bySubmissionId.set(evaluation.submissionId, {
      submissionId: evaluation.submissionId,
      qualityRating: Math.max(1, Math.min(5, Math.round(Number(evaluation.qualityRating) || 2))),
      isBotFarm: Boolean(evaluation.isBotFarm),
      clusterId: sanitizeClusterId(evaluation.clusterId, `submission-${evaluation.submissionId}`),
    });
  }

  const sanitized: GeminiEvaluation[] = [];
  for (const submission of submissions) {
    const evaluation = bySubmissionId.get(submission.id);
    if (!evaluation) {
      failAiAnalysis();
    }

    sanitized.push(evaluation);
  }

  return sanitized;
}

async function checkWalletEligibility(submissions: NormalizedSubmission[]) {
  const publicClient = getESpacePublicClient();
  const uniqueWallets = new Map<
    string,
    { canonicalAddress: string; originalAddress: string }
  >();

  for (const submission of submissions) {
    if (!isAddress(submission.walletAddress)) {
      uniqueWallets.set(submission.walletAddress.toLowerCase(), {
        canonicalAddress: "",
        originalAddress: submission.walletAddress,
      });
      continue;
    }

    const canonicalAddress = getAddress(submission.walletAddress);
    uniqueWallets.set(canonicalAddress.toLowerCase(), {
      canonicalAddress,
      originalAddress: submission.walletAddress,
    });
  }

  const walletStatuses = new Map<
    string,
    { canonicalAddress: string; isEligible: boolean; reason?: DisqualificationReason }
  >();

  await Promise.all(
    [...uniqueWallets.values()].map(async ({ canonicalAddress, originalAddress }) => {
      const key = canonicalAddress ? canonicalAddress.toLowerCase() : originalAddress.toLowerCase();

      if (!canonicalAddress) {
        walletStatuses.set(key, {
          canonicalAddress: originalAddress,
          isEligible: false,
          reason: "invalid_wallet_address",
        });
        return;
      }

      let nonce = 0;
      try {
        nonce = await publicClient.getTransactionCount({
          address: canonicalAddress as Address,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown RPC error";
        throw new Error(`Unable to verify wallet nonce for ${canonicalAddress}: ${message}`);
      }

      walletStatuses.set(key, {
        canonicalAddress,
        isEligible: nonce > 0,
        reason: nonce === 0 ? "new_wallet_nonce_zero" : undefined,
      });
    }),
  );

  return walletStatuses;
}

function buildDuplicateGroups(submissions: NormalizedSubmission[]) {
  const groups = new Map<string, number[]>();

  for (const submission of submissions) {
    const key = normalizeText(submission.content);
    const current = groups.get(key) ?? [];
    current.push(submission.id);
    groups.set(key, current);
  }

  return [...groups.values()].filter((group) => group.length > 1);
}

async function buildClusterArtifacts(
  title: string,
  prompt: string,
  submissions: NormalizedSubmission[],
  evaluationBySubmissionId: Map<number, GeminiEvaluation>,
) {
  const grouped = new Map<string, NormalizedSubmission[]>();

  for (const submission of submissions) {
    const clusterId = evaluationBySubmissionId.get(submission.id)?.clusterId ?? `submission-${submission.id}`;
    const current = grouped.get(clusterId) ?? [];
    current.push(submission);
    grouped.set(clusterId, current);
  }

  const groupedEntries = [...grouped.entries()].map(([clusterId, clusterSubmissions]) => {
    const ordered = [...clusterSubmissions].sort(compareBySubmittedAt);
    const signal = ordered
      .map((submission) => truncateText(submission.content, 180))
      .filter(Boolean)
      .slice(0, 3);

    return {
      clusterId,
      ordered,
      signal,
    };
  });

  const narrativeMap = new Map(
    (
      await generateClusterNarratives(
        title,
        prompt,
        groupedEntries.map((entry) => ({
          clusterId: entry.clusterId,
          submissionCount: entry.ordered.length,
          earliestSubmission: entry.ordered[0]?.content ?? "",
          representativeTexts: entry.signal,
        })),
      )
    ).map((item) => [sanitizeClusterId(item.clusterId, item.clusterId), item]),
  );

  const clusters = groupedEntries.map(({ clusterId, ordered, signal }) => {
    const narrative = narrativeMap.get(clusterId);
    if (!narrative) {
      failAiAnalysis();
    }

    return {
      id: clusterId,
      theme: narrative.theme,
      count: ordered.length,
      summary: narrative.summary,
      signal,
      submissionIds: ordered.map((submission) => submission.id),
    } satisfies AnalysisCluster;
  });

  return {
    clusters,
    narrativeMap,
  };
}

function buildHighlights(
  clusters: AnalysisCluster[],
  submissions: NormalizedSubmission[],
  clusterNarratives?: Map<string, GeminiClusterNarrative>,
): InsightHighlight[] {
  const bySubmissionId = new Map(submissions.map((submission) => [submission.id, submission]));

  return clusters.flatMap((cluster) => {
    const earliest = cluster.submissionIds
      .map((submissionId) => bySubmissionId.get(submissionId))
      .filter((submission): submission is NormalizedSubmission => Boolean(submission))
      .sort(compareBySubmittedAt)[0];

    if (!earliest) {
      return [];
    }

    const narrative = clusterNarratives?.get(cluster.id);
    if (!narrative) {
      failAiAnalysis();
    }

    return [{
      submissionId: earliest.id,
      title: narrative.highlightTitle || cluster.theme,
      reason: narrative.highlightReason || `This is the earliest eligible and clearly expressed submission in the "${cluster.theme}" cluster.`,
      bonusType: "discovery",
      bonusPoints: DISCOVERY_BONUS_POINTS,
    } satisfies InsightHighlight];
  });
}

export async function runSettlementEngine(
  input: SettlementEngineInput,
): Promise<SettlementEngineResult> {
  const submissions = input.submissions
    .map((submission) => ({
      id: submission.id,
      walletAddress: submission.walletAddress,
      submitterCoreAddress: submission.submitterCoreAddress,
      content: submission.content,
      submittedAt: normalizeSubmittedAt(submission.submittedAt),
    }))
    .sort(compareBySubmittedAt);

  const duplicateGroups = buildDuplicateGroups(submissions);
  const geminiEvaluations = sanitizeEvaluations(
    submissions,
    await evaluateSubmissionsWithGemini(input.title, input.prompt, submissions),
  );
  const evaluationBySubmissionId = new Map(
    geminiEvaluations.map((evaluation) => [evaluation.submissionId, evaluation]),
  );
  const walletStatuses = await checkWalletEligibility(submissions);
  const qualityRatings = Object.fromEntries(
    geminiEvaluations.map((evaluation) => [evaluation.submissionId, evaluation.qualityRating]),
  ) as Record<number, number>;

  const firstSubmissionByWallet = new Map<string, number>();
  const eligibleSubmissions: NormalizedSubmission[] = [];
  const disqualified: DisqualifiedSubmission[] = [];

  for (const submission of submissions) {
    const walletKey = isAddress(submission.walletAddress)
      ? getAddress(submission.walletAddress).toLowerCase()
      : submission.walletAddress.toLowerCase();

    const earliestSubmissionId = firstSubmissionByWallet.get(walletKey);
    if (typeof earliestSubmissionId === "undefined") {
      firstSubmissionByWallet.set(walletKey, submission.id);
    } else {
      disqualified.push({
        submissionId: submission.id,
        walletAddress: submission.walletAddress,
        reason: "duplicate_wallet_address",
      });
      continue;
    }

    const evaluation = evaluationBySubmissionId.get(submission.id);
    if (evaluation?.isBotFarm) {
      disqualified.push({
        submissionId: submission.id,
        walletAddress: submission.walletAddress,
        reason: "bot_farm",
      });
      continue;
    }

    const walletStatus = walletStatuses.get(walletKey);
    if (!walletStatus?.isEligible) {
      disqualified.push({
        submissionId: submission.id,
        walletAddress: submission.walletAddress,
        reason: walletStatus?.reason ?? "invalid_wallet_address",
      });
      continue;
    }

    eligibleSubmissions.push({
      ...submission,
      walletAddress: walletStatus.canonicalAddress,
    });
  }

  const { clusters, narrativeMap } = await buildClusterArtifacts(
    input.title,
    input.prompt,
    eligibleSubmissions,
    evaluationBySubmissionId,
  );
  const highlights = buildHighlights(clusters, eligibleSubmissions, narrativeMap);

  const scoringInput: SubmissionForScoring[] = eligibleSubmissions.map((submission) => ({
    id: submission.id,
    submitterCoreAddress: submission.submitterCoreAddress,
    payoutAddress: submission.walletAddress,
    summary: submission.content,
    createdAt: submission.submittedAt,
  }));

  const scoring = buildScoreBreakdown(
    scoringInput,
    clusters,
    highlights,
    qualityRatings,
    toRewardPoolString(input.totalUsdtReward),
  );

  const recipients = scoring.entries
    .filter((entry) => Number(entry.rewardAmount ?? "0") > 0)
    .map((entry) => entry.payoutAddress);
  const rewardAmounts = scoring.entries
    .filter((entry) => Number(entry.rewardAmount ?? "0") > 0)
    .map((entry) => entry.rewardAmount);

  return {
    clusters,
    duplicates: duplicateGroups,
    highlights,
    qualityRatings,
    scoreBreakdown: scoring.entries,
    recipients,
    rewardAmounts,
    totalPoints: scoring.totalPoints,
    eligibleSubmissionIds: eligibleSubmissions.map((submission) => submission.id),
    disqualified,
  };
}
