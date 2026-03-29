import { apiError } from "@/lib/api";
import { verifyCoreBountyCreation } from "@/lib/conflux/bounty-contract";
import { verifyRewardDeposit } from "@/lib/conflux/reward-vault";
import { activateBounty as activateBountyRecord, getBountyDetail, recordVaultDeposit } from "@/lib/db/queries";
import { canonicalJson, hashContent } from "@/lib/hash";
import { activateBountySchema } from "@/lib/validators";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const bountyId = Number(params.id);
    const json = await request.json();
    const payload = activateBountySchema.parse(json);
    const bounty = await getBountyDetail(bountyId);

    if (!bounty) {
      return apiError("Bounty not found.", 404);
    }

    if (bounty.status === "ACTIVE") {
      return Response.json({ bounty });
    }

    if (bounty.status !== "PENDING_FUNDING") {
      return apiError("Bounty cannot be activated from the current state.", 409);
    }

    if (bounty.vaultDepositTx && bounty.vaultDepositTx !== payload.depositTxHash) {
      return apiError("A different funding transaction is already recorded for this bounty.", 409);
    }

    const deposit = await verifyRewardDeposit({
      bountyId: bounty.id,
      rewardAmount: bounty.rewardAmount,
      creatorEspaceAddress: bounty.creatorEspaceAddress,
      depositTxHash: payload.depositTxHash,
    });

    if (!bounty.vaultDepositTx) {
      await recordVaultDeposit(bounty.id, deposit.vaultDepositTx);
    }

    const metadata = canonicalJson({
      title: bounty.title,
      description: bounty.description,
      prompt: bounty.prompt,
      questions: bounty.questions,
    });
    const metadataHash = hashContent(metadata);
    const core = await verifyCoreBountyCreation({
      draftBountyId: bounty.id,
      title: bounty.title,
      metadataHash,
      rewardAmount: bounty.rewardAmount,
      deadline: new Date(bounty.deadline),
      creatorCoreAddress: bounty.creatorCoreAddress,
      coreCreateTxHash: payload.coreCreateTxHash,
    });

    await activateBountyRecord(bounty.id, {
      metadataHash,
      chainBountyId: core.chainBountyId,
      vaultDepositTx: deposit.vaultDepositTx,
      coreCreateTx: core.coreCreateTx,
    });

    const detail = await getBountyDetail(bounty.id);
    return Response.json({ bounty: detail });
  } catch (error) {
    return apiError("Unable to activate bounty", 400, error);
  }
}
