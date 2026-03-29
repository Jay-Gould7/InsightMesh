"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

import { useFluentWallet } from "@/components/providers/fluent-provider";
import { supportSubmissionOnCore } from "@/lib/conflux/browser-core";
import { fakeBrowserTxHash } from "@/lib/demo-browser";
import type { CoreSpaceConfig } from "@/lib/types";
import { truncateAddress } from "@/lib/utils";

const truthy = new Set(["1", "true", "yes", "on"]);
const demoMode = truthy.has((process.env.NEXT_PUBLIC_DEMO_MODE ?? "true").toLowerCase());

export function SupportButton({
  bountyId,
  chainBountyId,
  submissionId,
  chainSubmissionId,
  coreConfig,
}: {
  bountyId: number;
  chainBountyId: number | null;
  submissionId: number;
  chainSubmissionId: number | null;
  coreConfig: CoreSpaceConfig;
}) {
  const router = useRouter();
  const { address } = useFluentWallet();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [supportStage, setSupportStage] = useState("");

  async function handleSupport() {
    setError("");
    setIsLoading(true);
    try {
      if (!address) {
        throw new Error("Connect your Core wallet before supporting a submission.");
      }

      if (typeof chainBountyId !== "number" || typeof chainSubmissionId !== "number") {
        throw new Error("This submission is not available on Core Space yet.");
      }

      let coreTxHash = fakeBrowserTxHash();
      if (coreConfig.mode !== "demo" && !demoMode) {
        setSupportStage("Confirm the Core support transaction in Fluent...");
        const result = await supportSubmissionOnCore({
          chainBountyId,
          chainSubmissionId,
          supporterCoreAddress: address,
          core: coreConfig,
        });
        coreTxHash = result.coreTxHash;
      } else {
        setSupportStage("Simulating the Core support transaction in demo mode...");
      }

      setSupportStage("Verifying the Core support transaction...");
      const response = await fetch("/api/submission/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bountyId, submissionId, supporterCoreAddress: address, coreTxHash }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to support this submission.");
      }

      startTransition(() => router.refresh());
    } catch (supportError) {
      setError(supportError instanceof Error ? supportError.message : "Unable to support this submission.");
    } finally {
      setSupportStage("");
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white">
        {address ? truncateAddress(address, 10) : "Connect Core in the top-right wallet hub"}
      </div>
      <button onClick={handleSupport} disabled={isLoading} className="rounded-full border border-white/10 px-4 py-2 text-sm text-white disabled:opacity-50">{isLoading ? "Supporting..." : "Support"}</button>
      {supportStage ? <p className="text-xs text-cyan-200">{supportStage}</p> : null}
      {error ? <p className="text-xs text-rose-300">{error}</p> : null}
    </div>
  );
}
