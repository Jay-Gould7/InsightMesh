import { apiError } from "@/lib/api";
import { CORE_BOUNTY_STATUS, updateCoreBountyStatus } from "@/lib/conflux/core-bounty-status";
import { coreAddressesEqual } from "@/lib/conflux/address";
import { getBountyDetail, saveAnalysis, saveScoreSnapshot } from "@/lib/db/queries";
import { fakeSnapshotKey } from "@/lib/demo";
import { env, hasCoreChainAccess } from "@/lib/env";
import {
  createManualBlockDisqualifications,
  mergeDisqualifiedSubmissions,
  redistributeScoreBreakdown,
  sanitizeScoreBreakdownEntry,
} from "@/lib/score-breakdown";
import { freezeSnapshotSchema } from "@/lib/validators";

class NoEligibleSubmissionsError extends Error {
  constructor(public readonly disqualified: unknown) {
    super("No eligible submissions remained after anti-Sybil filtering.");
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const payload = freezeSnapshotSchema.parse(json);
    const bounty = await getBountyDetail(payload.bountyId);

    if (!bounty) {
      return apiError("Bounty not found", 404);
    }

    if (!coreAddressesEqual(payload.callerAddress, bounty.creatorCoreAddress)) {
      return apiError("Only the bounty creator can freeze a score snapshot.", 403);
    }

    if (bounty.status === "SETTLED") {
      return apiError("Bounty is already settled.", 409);
    }

    if (bounty.status === "READY_TO_SETTLE") {
      return apiError("Score snapshot is already frozen.", 409);
    }

    if (bounty.status !== "ANALYZING") {
      return apiError("Lock submissions before freezing the snapshot.", 409);
    }

    if (bounty.submissions.length === 0) {
      return apiError("No submissions to score.", 400);
    }

    if (!env.demoMode && typeof bounty.chainBountyId === "number" && !hasCoreChainAccess()) {
      return apiError("Core relayer is not configured to close submissions on-chain.", 500);
    }

    try {
      if (!bounty.analysis || bounty.analysisStatus !== "COMPLETED") {
        return apiError("Run AI analysis before freezing the snapshot.", 409);
      }

      const scoreBreakdown = Array.isArray(bounty.analysis.scoreBreakdown)
        ? bounty.analysis.scoreBreakdown.map(sanitizeScoreBreakdownEntry)
        : [];
      if (scoreBreakdown.length === 0) {
        return apiError("Run AI analysis before freezing the snapshot.", 409);
      }

      const blockedSubmissionIds = new Set(payload.manualBlockedSubmissionIds ?? []);
      const blockedEntries = scoreBreakdown.filter((entry: any) => blockedSubmissionIds.has(entry.submissionId));
      const activeEntries = scoreBreakdown.filter((entry: any) => !blockedSubmissionIds.has(entry.submissionId));

      const disqualified = mergeDisqualifiedSubmissions(
        Array.isArray(bounty.analysis.disqualified) ? bounty.analysis.disqualified : [],
        createManualBlockDisqualifications(blockedEntries),
      );

      const finalScoreBreakdown = redistributeScoreBreakdown(activeEntries, bounty.rewardAmount);
      if (finalScoreBreakdown.entries.length === 0) {
        throw new NoEligibleSubmissionsError(disqualified);
      }

      if (typeof bounty.chainBountyId === "number") {
        await updateCoreBountyStatus({
          chainBountyId: bounty.chainBountyId,
          status: CORE_BOUNTY_STATUS.READY_TO_SETTLE,
        });
      }

      const snapshotKey = fakeSnapshotKey();
      await saveAnalysis(bounty.id, {
        clusters: bounty.analysis.clusters ?? [],
        duplicates: bounty.analysis.duplicates ?? [],
        highlights: bounty.analysis.highlights ?? [],
        scoreBreakdown: finalScoreBreakdown.entries.map(sanitizeScoreBreakdownEntry),
        disqualified,
        snapshotKey,
        aiModel: bounty.analysis.aiModel,
      });
      await saveScoreSnapshot({
        bountyId: bounty.id,
        snapshotKey,
        rewardPool: bounty.rewardAmount,
        totalPoints: finalScoreBreakdown.totalPoints,
        createdBy: bounty.creatorEspaceAddress,
        entries: finalScoreBreakdown.entries.map(sanitizeScoreBreakdownEntry),
      });

      const rewardEntries = finalScoreBreakdown.entries.filter((entry) => Number(entry.rewardAmount ?? "0") > 0);

      return Response.json({
        snapshotKey,
        totalPoints: finalScoreBreakdown.totalPoints,
        clusters: bounty.analysis.clusters ?? [],
        duplicates: bounty.analysis.duplicates ?? [],
        highlights: bounty.analysis.highlights ?? [],
        qualityRatings: {},
        scoreBreakdown: finalScoreBreakdown.entries.map(sanitizeScoreBreakdownEntry),
        recipients: rewardEntries.map((entry) => entry.payoutAddress),
        rewardAmounts: rewardEntries.map((entry) => entry.rewardAmount),
        eligibleSubmissionIds: finalScoreBreakdown.entries.map((entry) => entry.submissionId),
        disqualified,
      });
    } catch (error) {
      if (error instanceof NoEligibleSubmissionsError) {
        return apiError(error.message, 400, {
          disqualified: error.disqualified,
        });
      }

      throw error;
    }
  } catch (error) {
    return apiError(error instanceof Error ? error.message : "AI analysis failed. Please retry.", 400, error);
  }
}
