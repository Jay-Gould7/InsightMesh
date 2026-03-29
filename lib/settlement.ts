import { verifyMessage } from "ethers";

import { env } from "@/lib/env";

export function buildSettlementMessage(bountyId: number, snapshotKey: string) {
  return `InsightMesh settlement approval\nbounty:${bountyId}\nsnapshot:${snapshotKey}`;
}

export function verifySettlementSignature(
  creatorAddress: string,
  bountyId: number,
  snapshotKey: string,
  signature: string,
) {
  if (env.demoMode && signature === `demo:${creatorAddress.toLowerCase()}`) {
    return true;
  }

  const recovered = verifyMessage(buildSettlementMessage(bountyId, snapshotKey), signature);
  return recovered.toLowerCase() === creatorAddress.toLowerCase();
}

export function toTokenUnits(amount: string, decimals = 6) {
  const numeric = Number(amount || 0);
  return BigInt(Math.round(numeric * 10 ** decimals));
}
