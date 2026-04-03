import { analyzeSubmissions } from "@/lib/ai/analyzer";
import { buildScoreBreakdown } from "@/lib/ai/scorer";
import { apiError } from "@/lib/api";
import { getBountyDetail, markAnalyzing, saveAnalysis, saveScoreSnapshot } from "@/lib/db/queries";
import { fakeSnapshotKey } from "@/lib/demo";
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
      return apiError("Only the bounty creator can freeze a score snapshot.", 403);
    }

    if (bounty.submissions.length === 0) {
      return apiError("No submissions to score.", 400);
    }

    await markAnalyzing(bounty.id);

    // Step 1: AI-driven semantic analysis (clustering + quality ratings)
    const analysis = await analyzeSubmissions(
      bounty.title,
      bounty.prompt,
      bounty.submissions.map((submission: any) => ({
        id: submission.id,
        createdAt: submission.createdAt,
        text: submission.summary ?? JSON.stringify(submission.answers),
      })),
    );

    // Step 2: Build score breakdown using AI quality ratings
    const scoring = buildScoreBreakdown(
      bounty.submissions.map((submission: any) => ({
        id: submission.id,
        submitterCoreAddress: submission.submitterCoreAddress,
        payoutAddress: submission.payoutAddress,
        summary: submission.summary ?? JSON.stringify(submission.answers),
        createdAt: submission.createdAt,
      })),
      analysis.clusters,
      analysis.highlights,
      analysis.qualityRatings,
      bounty.rewardAmount,
    );

    const snapshotKey = fakeSnapshotKey();
    await saveAnalysis(bounty.id, {
      clusters: analysis.clusters,
      duplicates: analysis.duplicates,
      highlights: analysis.highlights,
      scoreBreakdown: scoring.entries,
      snapshotKey,
    });
    await saveScoreSnapshot({
      bountyId: bounty.id,
      snapshotKey,
      rewardPool: bounty.rewardAmount,
      totalPoints: scoring.totalPoints,
      createdBy: bounty.creatorEspaceAddress,
      entries: scoring.entries,
    });

    return Response.json({
      snapshotKey,
      totalPoints: scoring.totalPoints,
      clusters: analysis.clusters,
      duplicates: analysis.duplicates,
      highlights: analysis.highlights,
      qualityRatings: analysis.qualityRatings,
      scoreBreakdown: scoring.entries,
    });
  } catch (error) {
    return apiError("Unable to create score snapshot", 400, error);
  }
}
