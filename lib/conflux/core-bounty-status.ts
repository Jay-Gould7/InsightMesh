import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { resolve } from "node:path";

import { fakeTxHash } from "@/lib/demo";
import { env, hasCoreChainAccess } from "@/lib/env";

const execFileAsync = promisify(execFile);

export const CORE_BOUNTY_STATUS = {
  PENDING_FUNDING: 0,
  ACTIVE: 1,
  ANALYZING: 2,
  READY_TO_SETTLE: 3,
  SETTLED: 4,
  CANCELLED: 5,
} as const;

export type CoreBountyStatus = (typeof CORE_BOUNTY_STATUS)[keyof typeof CORE_BOUNTY_STATUS];

export async function updateCoreBountyStatus(input: {
  chainBountyId: number;
  status: CoreBountyStatus;
}) {
  if (env.demoMode) {
    return {
      coreTxHash: fakeTxHash(),
    };
  }

  if (!hasCoreChainAccess()) {
    throw new Error("Core relayer is not configured.");
  }

  const scriptPath = resolve(process.cwd(), "scripts/core-update-status.mjs");
  const { stdout, stderr } = await execFileAsync(
    process.execPath,
    [scriptPath, "--bountyId", String(input.chainBountyId), "--status", String(input.status)],
    {
      cwd: process.cwd(),
      env: process.env,
    },
  );

  if (stderr?.trim()) {
    throw new Error(stderr.trim());
  }

  try {
    const parsed = JSON.parse(stdout.trim()) as { coreTxHash?: string };
    if (!parsed.coreTxHash) {
      throw new Error("Missing coreTxHash in script output.");
    }

    return parsed;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown parse error";
    throw new Error(`Unable to parse Core status update result: ${message}`);
  }
}
