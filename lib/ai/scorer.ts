import type { AnalysisCluster, InsightHighlight, ScoreBreakdownEntry } from "@/lib/types";

export type SubmissionForScoring = {
  id: number;
  submitterCoreAddress: string;
  payoutAddress: string;
  summary: string;
  createdAt: Date;
};

const MAX_CONSENSUS_POINTS = 20;
const CONSENSUS_DECAY_SCALE = 3;

export type ScorePenaltyConfig = {
  qualityMultiplier?: number;
  disableDiscovery?: boolean;
  disableConsensus?: boolean;
  sybilRiskLevel?: "high";
  sybilRiskReason?: "bot_farm";
  sybilPenaltyLabel?: string;
};

function toCents(amount: string) {
  return Math.max(0, Math.round(Number(amount || 0) * 100));
}

function fromCents(value: number) {
  return (value / 100).toFixed(2);
}

function computeConsensusBonus(clusterSize: number) {
  const supportingVoices = Math.max(0, clusterSize - 1);
  if (supportingVoices === 0) {
    return 0;
  }

  const saturation = 1 - Math.exp(-supportingVoices / CONSENSUS_DECAY_SCALE);
  return Math.min(MAX_CONSENSUS_POINTS, Math.round(MAX_CONSENSUS_POINTS * saturation));
}

/**
 * Build score breakdown using the 4-pillar AI-driven model:
 *
 * 1. Base Participation  = 10 pts (fixed)
 * 2. AI Quality Score    = qualityRating * 8 (8-40 pts)
 * 3. Semantic Consensus  = 20 * (1 - e^(-(clusterSize - 1) / 3)) (0-20 pts)
 * 4. Discovery Bonus     = 12 pts for earliest submission in each cluster
 *
 * Max possible: 82 pts
 */
export function buildScoreBreakdown(
  submissions: SubmissionForScoring[],
  clusters: AnalysisCluster[],
  highlights: InsightHighlight[],
  qualityRatings: Record<number, number>,
  rewardPool: string,
  penaltiesBySubmissionId?: Map<number, ScorePenaltyConfig>,
): { totalPoints: number; entries: ScoreBreakdownEntry[] } {
  // Build cluster membership map: submissionId -> clusterSize
  const clusterSizeBySubmission = new Map<number, number>();
  for (const cluster of clusters) {
    const consensusEligibleCount = cluster.submissionIds.filter(
      (submissionId) => !penaltiesBySubmissionId?.get(submissionId)?.disableConsensus,
    ).length;

    for (const submissionId of cluster.submissionIds) {
      clusterSizeBySubmission.set(submissionId, consensusEligibleCount);
    }
  }

  // Build highlight lookup: submissionId -> bonus points
  const highlightMap = new Map(highlights.map((h) => [h.submissionId, h]));

  const baseEntries = submissions.map((submission) => {
    const penalty = penaltiesBySubmissionId?.get(submission.id);

    // Pillar 1: Base Participation (fixed)
    const participationPts = 10;

    // Pillar 2: AI Quality Score (LLM qualityRating * 8)
    const rating = qualityRatings[submission.id] ?? 2;
    const baseQualityPts = Math.max(1, Math.min(5, Math.round(rating))) * 8;
    const qualityPts = Math.max(0, Math.round(baseQualityPts * (penalty?.qualityMultiplier ?? 1)));

    // Pillar 3: Discovery Bonus (earliest in cluster)
    const discoveryBonus = penalty?.disableDiscovery ? 0 : highlightMap.get(submission.id)?.bonusPoints ?? 0;

    // Pillar 4: Semantic Consensus Bonus with diminishing marginal returns
    const clusterSize = clusterSizeBySubmission.get(submission.id) ?? 1;
    const consensusBonus = penalty?.disableConsensus ? 0 : computeConsensusBonus(clusterSize);

    const totalPoints = participationPts + qualityPts + discoveryBonus + consensusBonus;

    return {
      submissionId: submission.id,
      submitterCoreAddress: submission.submitterCoreAddress,
      payoutAddress: submission.payoutAddress,
      participationPts,
      qualityPts,
      discoveryBonus,
      consensusBonus,
      totalPoints,
      rewardAmount: "0.00",
      summary: submission.summary,
      sybilRiskLevel: penalty?.sybilRiskLevel,
      sybilRiskReason: penalty?.sybilRiskReason,
      sybilPenaltyLabel: penalty?.sybilPenaltyLabel,
      qualityMultiplier: penalty?.qualityMultiplier,
    } satisfies ScoreBreakdownEntry;
  });

  const totalPoints = baseEntries.reduce((sum, entry) => sum + entry.totalPoints, 0);
  const rewardPoolCents = toCents(rewardPool);

  if (totalPoints === 0 || rewardPoolCents === 0) {
    return { totalPoints, entries: baseEntries };
  }

  // Proportional distribution
  let distributed = 0;
  const ranked = [...baseEntries].sort((a, b) => b.totalPoints - a.totalPoints || a.submissionId - b.submissionId);
  for (const entry of ranked) {
    const cents = Math.floor((rewardPoolCents * entry.totalPoints) / totalPoints);
    entry.rewardAmount = fromCents(cents);
    distributed += cents;
  }

  // Distribute remainder to top-ranked entries (1 cent each)
  let remainder = rewardPoolCents - distributed;
  let index = 0;
  while (remainder > 0 && ranked.length > 0) {
    const current = ranked[index % ranked.length];
    current.rewardAmount = fromCents(toCents(current.rewardAmount) + 1);
    remainder -= 1;
    index += 1;
  }

  return {
    totalPoints,
    entries: ranked.map((entry) => ({ ...entry })),
  };
}
