import { analyzeSubmissions } from "@/lib/ai/analyzer";
import { apiError } from "@/lib/api";
import { getBountyDetail } from "@/lib/db/queries";
import { creatorActionSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const payload = creatorActionSchema.parse(json);
    const bounty = await getBountyDetail(payload.bountyId);

    if (!bounty) {
      return apiError("Bounty not found", 404);
    }

    if (payload.callerAddress.toLowerCase() !== bounty.creatorCoreAddress.toLowerCase()) {
      return apiError("Only the bounty creator can trigger analysis.", 403);
    }

    if (bounty.submissions.length === 0) {
      return apiError("At least one submission is required before analysis.", 400);
    }

    const result = await analyzeSubmissions(
      bounty.title,
      bounty.prompt,
      bounty.submissions.map((submission: any) => ({
        id: submission.id,
        createdAt: submission.createdAt,
        text: submission.summary ?? JSON.stringify(submission.answers),
      })),
    );

    return Response.json(result);
  } catch (error) {
    return apiError("Unable to analyze submissions", 400, error);
  }
}
