import { apiError } from "@/lib/api";
import { distributeRewards } from "@/lib/conflux/reward-vault";
import { attachCreatorSignature, getBountyDetail, markSettled } from "@/lib/db/queries";
import { verifySettlementSignature } from "@/lib/settlement";
import { settlementSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const payload = settlementSchema.parse(json);
    const bounty = await getBountyDetail(payload.bountyId);

    if (!bounty || !bounty.scoreSnapshot) {
      return apiError("Score snapshot not found.", 404);
    }

    if (bounty.status === "SETTLED") {
      return apiError("Bounty is already settled.", 409);
    }

    if (bounty.scoreSnapshot.snapshotKey !== payload.snapshotKey) {
      return apiError("Snapshot key mismatch.", 400);
    }

    const isValid = verifySettlementSignature(
      bounty.creatorEspaceAddress,
      bounty.id,
      payload.snapshotKey,
      payload.creatorSignature,
    );
    if (!isValid) {
      return apiError("Invalid creator signature.", 401);
    }

    const recipients = bounty.scoreSnapshot.entries
      .filter((entry: any) => Number(entry.rewardAmount ?? "0") > 0)
      .map((entry: any) => entry.submission.payoutAddress);
    const rewardAmounts = bounty.scoreSnapshot.entries
      .filter((entry: any) => Number(entry.rewardAmount ?? "0") > 0)
      .map((entry: any) => entry.rewardAmount ?? "0.00");

    const result = await distributeRewards(bounty.id, recipients, rewardAmounts);
    await attachCreatorSignature(bounty.id, payload.creatorSignature);
    await markSettled(bounty.id, result.settlementTx);

    return Response.json({ settlementTx: result.settlementTx });
  } catch (error) {
    return apiError("Unable to settle bounty", 400, error);
  }
}
