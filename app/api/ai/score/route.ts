import { apiError } from "@/lib/api";
import { coreAddressesEqual } from "@/lib/conflux/address";
import { getBountyDetail, markAnalyzing, saveAnalysis, saveScoreSnapshot } from "@/lib/db/queries";
import { fakeSnapshotKey } from "@/lib/demo";
import { runSettlementEngine } from "@/lib/settlement-engine";
import { creatorActionSchema } from "@/lib/validators";

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

    if (bounty.submissions.length === 0) {
      return apiError("No submissions to score.", 400);
    }

    await markAnalyzing(bounty.id);

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
      return apiError("No eligible submissions remained after anti-Sybil filtering.", 400, {
        disqualified: engine.disqualified,
      });
    }

    const snapshotKey = fakeSnapshotKey();
    await saveAnalysis(bounty.id, {
      clusters: engine.clusters,
      duplicates: engine.duplicates,
      highlights: engine.highlights,
      scoreBreakdown: engine.scoreBreakdown,
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
    return apiError("Unable to create score snapshot", 400, error);
  }
}
