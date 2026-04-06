import { apiError } from "@/lib/api";
import { coreAddressesEqual } from "@/lib/conflux/address";
import { getBountyDetail } from "@/lib/db/queries";
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

    return Response.json(result);
  } catch (error) {
    return apiError("Unable to analyze submissions", 400, error);
  }
}
