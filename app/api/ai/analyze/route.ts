import { apiError } from "@/lib/api";
import { coreAddressesEqual } from "@/lib/conflux/address";
import { getBountyDetail, saveAnalysisPreview } from "@/lib/db/queries";
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
      return apiError("Only the bounty creator can trigger analysis.", 403);
    }

    if (bounty.status === "SETTLED") {
      return apiError("Bounty is already settled.", 409);
    }

    if (bounty.status === "READY_TO_SETTLE") {
      return apiError("Score snapshot is already frozen.", 409);
    }

    if (bounty.status !== "ANALYZING") {
      return apiError("Lock submissions before running AI analysis.", 409);
    }

    if (bounty.submissions.length === 0) {
      return apiError("At least one submission is required before analysis.", 400);
    }

    const result = await runSettlementEngine({
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

    await saveAnalysisPreview(bounty.id, {
      clusters: result.clusters,
      duplicates: result.duplicates,
      highlights: result.highlights,
      scoreBreakdown: result.scoreBreakdown,
      disqualified: result.disqualified,
      aiModel: result.aiModel,
    });

    return Response.json(result);
  } catch (error) {
    return apiError(error instanceof Error ? error.message : "AI analysis failed. Please retry.", 400, error);
  }
}
