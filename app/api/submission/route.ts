import { Prisma } from "@prisma/client";

import { apiError } from "@/lib/api";
import { verifyCoreSubmission } from "@/lib/conflux/submission-contract";
import { createSubmission, getBountyDetail } from "@/lib/db/queries";
import { summarizeAnswers } from "@/lib/feedback";
import { hashContent } from "@/lib/hash";
import { submissionSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const payload = submissionSchema.parse(json);
    const bounty = await getBountyDetail(payload.bountyId);

    if (!bounty) {
      return apiError("Bounty not found", 404);
    }

    if (bounty.status !== "ACTIVE") {
      return apiError("Bounty is not accepting submissions.", 400);
    }

    if (typeof bounty.chainBountyId !== "number") {
      return apiError("Bounty is not published on Core Space yet.", 409);
    }

    if (new Date(bounty.deadline).getTime() < Date.now()) {
      return apiError("Bounty deadline has passed.", 400);
    }

    const summary = summarizeAnswers(payload.answers);
    const contentHash = hashContent({ bountyId: bounty.id, answers: payload.answers, payoutAddress: payload.payoutAddress });
    const chainResult = await verifyCoreSubmission({
      chainBountyId: bounty.chainBountyId,
      contentHash,
      payoutAddress: payload.payoutAddress,
      submitterCoreAddress: payload.submitterCoreAddress,
      coreTxHash: payload.coreTxHash,
    });

    const submission = await createSubmission({
      bountyId: bounty.id,
      submitterCoreAddress: payload.submitterCoreAddress,
      payoutAddress: payload.payoutAddress,
      contentHash,
      answers: payload.answers,
      summary,
      coreSubmissionId: chainResult.coreSubmissionId,
      coreTxHash: chainResult.coreTxHash,
    });

    return Response.json({ submission }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return apiError("Each address can only submit once per bounty.", 409);
    }

    return apiError("Unable to submit feedback", 400, error);
  }
}
