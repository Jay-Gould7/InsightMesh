import type { DisqualifiedSubmission, ScoreBreakdownEntry } from "@/lib/types";

export type RankedScoreBreakdownEntry = ScoreBreakdownEntry & {
  rank?: number | null;
};

export function toRewardCents(amount: string | null | undefined) {
  return Math.max(0, Math.round(Number(amount || 0) * 100));
}

export function fromRewardCents(value: number) {
  return (value / 100).toFixed(2);
}

export function getRewardPoolFromEntries(entries: Array<Pick<ScoreBreakdownEntry, "rewardAmount">>) {
  const totalCents = entries.reduce((sum, entry) => sum + toRewardCents(entry.rewardAmount), 0);
  return fromRewardCents(totalCents);
}

export function sanitizeScoreBreakdownEntry(entry: RankedScoreBreakdownEntry): ScoreBreakdownEntry {
  return {
    submissionId: entry.submissionId,
    submitterCoreAddress: entry.submitterCoreAddress,
    payoutAddress: entry.payoutAddress,
    participationPts: entry.participationPts,
    qualityPts: entry.qualityPts,
    discoveryBonus: entry.discoveryBonus,
    consensusBonus: entry.consensusBonus,
    totalPoints: entry.totalPoints,
    rewardAmount: entry.rewardAmount,
    summary: entry.summary,
    sybilRiskLevel: entry.sybilRiskLevel,
    sybilRiskReason: entry.sybilRiskReason,
    sybilPenaltyLabel: entry.sybilPenaltyLabel,
    qualityMultiplier: entry.qualityMultiplier,
  };
}

export function createManualBlockDisqualifications(
  entries: Array<Pick<ScoreBreakdownEntry, "submissionId" | "payoutAddress">>,
): DisqualifiedSubmission[] {
  return entries.map((entry) => ({
    submissionId: entry.submissionId,
    walletAddress: entry.payoutAddress,
    reason: "creator_manual_block",
  }));
}

export function mergeDisqualifiedSubmissions(
  existing: DisqualifiedSubmission[],
  additions: DisqualifiedSubmission[],
) {
  const merged = new Map<number, DisqualifiedSubmission>();

  for (const item of existing) {
    merged.set(item.submissionId, item);
  }

  for (const item of additions) {
    merged.set(item.submissionId, item);
  }

  return [...merged.values()].sort((left, right) => left.submissionId - right.submissionId);
}

export function redistributeScoreBreakdown<T extends RankedScoreBreakdownEntry>(
  entries: T[],
  rewardPool: string,
): { totalPoints: number; entries: Array<T & { rank: number }> } {
  const ranked = [...entries]
    .map((entry) => ({ ...entry }))
    .sort((left, right) => right.totalPoints - left.totalPoints || left.submissionId - right.submissionId);

  const rewardPoolCents = toRewardCents(rewardPool);
  const totalPoints = ranked.reduce((sum, entry) => sum + Math.max(0, entry.totalPoints ?? 0), 0);

  if (ranked.length === 0) {
    return { totalPoints, entries: [] };
  }

  if (rewardPoolCents === 0 || totalPoints === 0) {
    return {
      totalPoints,
      entries: ranked.map((entry, index) => ({
        ...entry,
        rewardAmount: "0.00",
        rank: index + 1,
      })) as Array<T & { rank: number }>,
    };
  }

  let distributed = 0;
  for (const entry of ranked) {
    const cents = Math.floor((rewardPoolCents * entry.totalPoints) / totalPoints);
    entry.rewardAmount = fromRewardCents(cents);
    distributed += cents;
  }

  let remainder = rewardPoolCents - distributed;
  let index = 0;
  while (remainder > 0 && ranked.length > 0) {
    const current = ranked[index % ranked.length];
    current.rewardAmount = fromRewardCents(toRewardCents(current.rewardAmount) + 1);
    remainder -= 1;
    index += 1;
  }

  return {
    totalPoints,
    entries: ranked.map((entry, rank) => ({
      ...entry,
      rank: rank + 1,
    })) as Array<T & { rank: number }>,
  };
}

export function buildPreviewScoreBreakdown<T extends RankedScoreBreakdownEntry>(
  entries: T[],
  blockedSubmissionIds: number[],
) {
  const blockedSet = new Set(blockedSubmissionIds);
  const activeEntries = entries.filter((entry) => !blockedSet.has(entry.submissionId));
  const blockedEntries = entries
    .filter((entry) => blockedSet.has(entry.submissionId))
    .map((entry) => ({ ...entry, rewardAmount: "0.00", rank: null }));

  const rewardPool = getRewardPoolFromEntries(entries);
  const redistributed = redistributeScoreBreakdown(activeEntries, rewardPool).entries;

  return [...redistributed, ...blockedEntries];
}
