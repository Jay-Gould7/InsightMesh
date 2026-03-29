import { apiError } from "@/lib/api";
import { createDraftBounty, listVisibleBounties } from "@/lib/db/queries";
import { env, hasCoreContractConfig, hasRewardVaultConfig } from "@/lib/env";
import { createBountySchema } from "@/lib/validators";

export async function GET() {
  const bounties = await listVisibleBounties();
  return Response.json({ bounties });
}

export async function POST(request: Request) {
  try {
    if (!env.demoMode && (!hasRewardVaultConfig() || !hasCoreContractConfig())) {
      return apiError("Reward vault or Core contracts are not configured yet.", 409);
    }

    const json = await request.json();
    const payload = createBountySchema.parse(json);
    const bounty = await createDraftBounty(payload);
    return Response.json({
      bounty,
      funding: {
        mode: env.demoMode ? "demo" : "wallet",
        chainId: env.eSpaceChainId,
        rpcUrl: env.eSpaceRpcUrl,
        rewardVaultAddress: env.eSpaceRewardVaultAddress,
        usdt0Address: env.eSpaceUsdt0Address,
        decimals: 6,
      },
      core: {
        mode: env.demoMode ? "demo" : "wallet",
        networkId: env.coreNetworkId,
        rpcUrl: env.coreRpcUrl,
        bountyRegistryAddress: env.coreRegistryAddress,
        submissionRegistryAddress: env.coreSubmissionAddress,
        rewardDecimals: 6,
      },
    }, { status: 201 });
  } catch (error) {
    return apiError("Unable to create bounty", 400, error);
  }
}
