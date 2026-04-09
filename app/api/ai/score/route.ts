import { apiError } from "@/lib/api";
import { CORE_BOUNTY_STATUS, updateCoreBountyStatus } from "@/lib/conflux/core-bounty-status";
import { coreAddressesEqual } from "@/lib/conflux/address";
import { getBountyDetail, saveAnalysis, saveScoreSnapshot } from "@/lib/db/queries";
import { fakeSnapshotKey } from "@/lib/demo";
import { env, hasCoreChainAccess } from "@/lib/env";
import { runSettlementEngine } from "@/lib/settlement-engine";
import { creatorActionSchema } from "@/lib/validators";

class NoEligibleSubmissionsError extends Error {
  constructor(public readonly disqualified: unknown) {
    super("No eligible submissions remained after anti-Sybil filtering.");
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const payload = creatorActionSchema.parse(json);
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
      const engine = await runSettlementEngine({
        title: bounty.title,
        prompt: bounty.prompt,
        totalUsdtReward: bounty.rewardAmount,
        submissions: bounty.submissions.map((submission: any) => ({
          id: submission.id,
          walletAddress: submission.payoutAddress,
          submitterCoreAddress: submission.submitterCoreAddress,
          content: submission.summary ?? JSON.stringify(submission.answers),
          submittedAt: submission.createdAt,
        })),
      });

      if (engine.scoreBreakdown.length === 0 || engine.recipients.length === 0) {
        throw new NoEligibleSubmissionsError(engine.disqualified);
      }

      if (typeof bounty.chainBountyId === "number") {
        await updateCoreBountyStatus({
          chainBountyId: bounty.chainBountyId,
          status: CORE_BOUNTY_STATUS.READY_TO_SETTLE,
        });
      }

      const snapshotKey = fakeSnapshotKey();
      await saveAnalysis(bounty.id, {
        clusters: engine.clusters,
        duplicates: engine.duplicates,
        highlights: engine.highlights,
        scoreBreakdown: engine.scoreBreakdown,
        disqualified: engine.disqualified,
        snapshotKey,
      });
      await saveScoreSnapshot({
        bountyId: bounty.id,
        snapshotKey,
        rewardPool: bounty.rewardAmount,
        totalPoints: engine.totalPoints,
        createdBy: bounty.creatorEspaceAddress,
        entries: engine.scoreBreakdown,
      });

      return Response.json({
        snapshotKey,
        totalPoints: engine.totalPoints,
        clusters: engine.clusters,
        duplicates: engine.duplicates,
        highlights: engine.highlights,
        qualityRatings: engine.qualityRatings,
        scoreBreakdown: engine.scoreBreakdown,
        recipients: engine.recipients,
        rewardAmounts: engine.rewardAmounts,
        eligibleSubmissionIds: engine.eligibleSubmissionIds,
        disqualified: engine.disqualified,
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
