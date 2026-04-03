import type { AnalysisCluster, InsightHighlight, ScoreBreakdownEntry } from "@/lib/types";

export type SubmissionForScoring = {
  id: number;
  submitterCoreAddress: string;
  payoutAddress: string;
  summary: string;
  createdAt: Date;
};

function toCents(amount: string) {
  return Math.max(0, Math.round(Number(amount || 0) * 100));
}

function fromCents(value: number) {
  return (value / 100).toFixed(2);
}

/**
 * Build score breakdown using the 4-pillar AI-driven model:
 *
 * 1. Base Participation  = 10 pts (fixed)
 * 2. AI Quality Score    = qualityRating * 8 (8-40 pts)
 * 3. Semantic Consensus  = (clusterSize / maxClusterSize) * 20 (0-20 pts)
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
): { totalPoints: number; entries: ScoreBreakdownEntry[] } {
  // Build cluster membership map: submissionId -> clusterSize
  const clusterSizeBySubmission = new Map<number, number>();
  for (const cluster of clusters) {
    for (const submissionId of cluster.submissionIds) {
      clusterSizeBySubmission.set(submissionId, cluster.count);
    }
  }

  // Find the largest cluster for proportional consensus scoring
  const maxClusterSize = clusters.length > 0
    ? Math.max(...clusters.map((c) => c.count))
    : 1;

  // Build highlight lookup: submissionId -> bonus points
  const highlightMap = new Map(highlights.map((h) => [h.submissionId, h]));

  const baseEntries = submissions.map((submission) => {
    // Pillar 1: Base Participation (fixed)
    const participationPts = 10;

    // Pillar 2: AI Quality Score (LLM qualityRating * 8)
    const rating = qualityRatings[submission.id] ?? 2;
    const qualityPts = Math.max(1, Math.min(5, Math.round(rating))) * 8;

    // Pillar 3: Discovery Bonus (earliest in cluster)
    const discoveryBonus = highlightMap.get(submission.id)?.bonusPoints ?? 0;

    // Pillar 4: Semantic Consensus Bonus (cluster size proportion)
    const clusterSize = clusterSizeBySubmission.get(submission.id) ?? 1;
    const consensusBonus = Math.round((clusterSize / maxClusterSize) * 20);

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
