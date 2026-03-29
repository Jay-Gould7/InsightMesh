import type { AnalysisCluster, InsightHighlight, ScoreBreakdownEntry } from "@/lib/types";

export type SubmissionForScoring = {
  id: number;
  submitterCoreAddress: string;
  payoutAddress: string;
  summary: string;
  supportCount: number;
};

function uniqueWordCount(text: string) {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 1);

  return new Set(words).size;
}

function toCents(amount: string) {
  return Math.max(0, Math.round(Number(amount || 0) * 100));
}

function fromCents(value: number) {
  return (value / 100).toFixed(2);
}

export function buildScoreBreakdown(
  submissions: SubmissionForScoring[],
  clusters: AnalysisCluster[],
  highlights: InsightHighlight[],
  rewardPool: string,
): { totalPoints: number; entries: ScoreBreakdownEntry[] } {
  const clusterSizeBySubmission = new Map<number, number>();
  for (const cluster of clusters) {
    for (const submissionId of cluster.submissionIds) {
      clusterSizeBySubmission.set(submissionId, cluster.count);
    }
  }

  const highlightMap = new Map(highlights.map((highlight) => [highlight.submissionId, highlight]));

  const baseEntries = submissions.map((submission) => {
    const participationPts = 10;
    const qualityPts = Math.min(40, Math.max(8, Math.floor(uniqueWordCount(submission.summary) / 2)));
    const discoveryBonus = highlightMap.get(submission.id)?.bonusPoints ?? 0;
    const consensusBonus = Math.min(20, submission.supportCount * 4 + (clusterSizeBySubmission.get(submission.id) ?? 1));
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

  let distributed = 0;
  const ranked = [...baseEntries].sort((a, b) => b.totalPoints - a.totalPoints || a.submissionId - b.submissionId);
  for (const entry of ranked) {
    const cents = Math.floor((rewardPoolCents * entry.totalPoints) / totalPoints);
    entry.rewardAmount = fromCents(cents);
    distributed += cents;
  }

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
