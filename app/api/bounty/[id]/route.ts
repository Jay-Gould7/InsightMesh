import { apiError } from "@/lib/api";
import { CORE_BOUNTY_STATUS, updateCoreBountyStatus } from "@/lib/conflux/core-bounty-status";
import { coreAddressesEqual } from "@/lib/conflux/address";
import { getBountyDetail, lockBountyForReview, unlockBountyForReview } from "@/lib/db/queries";
import { env, hasCoreChainAccess } from "@/lib/env";
import { bountyReviewActionSchema } from "@/lib/validators";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const bounty = await getBountyDetail(Number(params.id));

  if (!bounty) {
    return apiError("Bounty not found", 404);
  }

  return Response.json({ bounty });
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const bountyId = Number(params.id);
    const json = await request.json();
    const payload = bountyReviewActionSchema.parse(json);
    const bounty = await getBountyDetail(bountyId);

    if (!bounty) {
      return apiError("Bounty not found", 404);
    }

    if (!coreAddressesEqual(payload.callerAddress, bounty.creatorCoreAddress)) {
      return apiError("Only the bounty creator can update submission access.", 403);
    }

    if (!env.demoMode && typeof bounty.chainBountyId === "number" && !hasCoreChainAccess()) {
      return apiError("Core relayer is not configured to update bounty status on-chain.", 500);
    }

    if (payload.action === "lock") {
      if (bounty.status === "SETTLED") {
        return apiError("Bounty is already settled.", 409);
      }

      if (bounty.status === "READY_TO_SETTLE") {
        return apiError("Score snapshot is already frozen.", 409);
      }

      if (bounty.status !== "ACTIVE") {
        return apiError("Only active bounties can be locked.", 409);
      }

      if (new Date(bounty.deadline).getTime() < Date.now()) {
        return apiError("The bounty deadline has already passed.", 409);
      }

      if (typeof bounty.chainBountyId === "number") {
        await updateCoreBountyStatus({
          chainBountyId: bounty.chainBountyId,
          status: CORE_BOUNTY_STATUS.ANALYZING,
        });
      }

      const updated = await lockBountyForReview(bounty.id);
      return Response.json({ bounty: updated });
    }

    if (bounty.status !== "ANALYZING") {
      return apiError("Only locked bounties can be unlocked.", 409);
    }

    if (new Date(bounty.deadline).getTime() < Date.now()) {
      return apiError("The bounty deadline has passed, so submissions cannot be reopened.", 409);
    }

    if (typeof bounty.chainBountyId === "number") {
      await updateCoreBountyStatus({
        chainBountyId: bounty.chainBountyId,
        status: CORE_BOUNTY_STATUS.ACTIVE,
      });
    }

    const updated = await unlockBountyForReview(bounty.id);
    return Response.json({ bounty: updated });
  } catch (error) {
    return apiError("Unable to update bounty review state", 400, error);
  }
}
