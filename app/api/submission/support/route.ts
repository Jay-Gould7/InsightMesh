import { Prisma } from "@prisma/client";

import { apiError } from "@/lib/api";
import { verifyCoreSupport } from "@/lib/conflux/submission-contract";
import { createSupport, getBountyDetail } from "@/lib/db/queries";
import { supportSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const payload = supportSchema.parse(json);
    const bounty = await getBountyDetail(payload.bountyId);

    if (!bounty) {
      return apiError("Bounty not found", 404);
    }

    if (new Date(bounty.deadline).getTime() < Date.now()) {
      return apiError("Bounty deadline has passed.", 400);
    }

    const target = bounty.submissions.find((submission: any) => submission.id === payload.submissionId);
    if (!target) {
      return apiError("Submission not found.", 404);
    }

    if (typeof bounty.chainBountyId !== "number" || typeof target.coreSubmissionId !== "number") {
      return apiError("Core Space identifiers are missing for this submission.", 409);
    }

    if (target.submitterCoreAddress.toLowerCase() === payload.supporterCoreAddress.toLowerCase()) {
      return apiError("Self-support is not allowed.", 400);
    }

    await verifyCoreSupport({
      chainBountyId: bounty.chainBountyId,
      chainSubmissionId: target.coreSubmissionId,
      supporterCoreAddress: payload.supporterCoreAddress,
      coreTxHash: payload.coreTxHash,
    });
    await createSupport(payload);
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return apiError("Each address can support a submission only once.", 409);
    }

    return apiError("Unable to register support", 400, error);
  }
}
