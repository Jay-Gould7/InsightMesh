import { apiError } from "@/lib/api";
import { getBountyDetail } from "@/lib/db/queries";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const bounty = await getBountyDetail(Number(params.id));

  if (!bounty) {
    return apiError("Bounty not found", 404);
  }

  return Response.json({ bounty });
}
