"use client";

import { ShieldAlert, ShieldCheck } from "lucide-react";
import type { DisqualifiedSubmission } from "@/lib/types";

export function AntiSybilPanel({ disqualified }: { disqualified: DisqualifiedSubmission[] }) {
  const hasEntries = Boolean(disqualified?.length);

  return (
    <div className="flex h-[28rem] flex-col overflow-hidden rounded-3xl border border-rose-500/20 bg-rose-500/5 backdrop-blur-xl transition-all duration-300">
      <div className="flex items-center gap-4 border-b border-white/8 px-6 py-6">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-full ${
            hasEntries ? "bg-rose-500/20 text-rose-400" : "bg-lime-400/10 text-lime-300"
          }`}
        >
          {hasEntries ? <ShieldAlert className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />}
        </div>
        <div>
          <h3 className={`text-lg font-semibold ${hasEntries ? "text-rose-200" : "text-lime-200"}`}>
            {hasEntries
              ? `Anti-Sybil Wall Blocked ${disqualified.length} Threat${disqualified.length > 1 ? "s" : ""}`
              : "Anti-Sybil Wall"}
          </h3>
          <p className="mt-1 text-sm text-stone-400">
            {hasEntries
              ? "These submissions were automatically disqualified to protect the reward pool."
              : "No sybil or bot attacks detected in this cohort."}
          </p>
        </div>
      </div>

      <div className="min-h-0 flex-1 px-6 py-4">
        {hasEntries ? (
          <div className="h-full overflow-y-auto overscroll-contain pr-1">
          <div className="grid gap-3">
            {disqualified.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between rounded-xl bg-black/20 p-4 border border-rose-500/10">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-stone-200 font-mono">
                    {item.walletAddress.substring(0, 10)}...{item.walletAddress.substring(item.walletAddress.length - 8)}
                  </span>
                  <span className="text-xs text-rose-400">
                    {item.reason === "new_wallet_nonce_zero"
                      ? "Zero Transaction History (Nonce 0)"
                      : item.reason === "duplicate_wallet_address"
                      ? "Multiple Submissions from Single Identity"
                      : item.reason === "creator_manual_block"
                      ? "Creator Excluded High-Risk Submission"
                      : item.reason === "bot_farm"
                      ? "AI Detected Coordinated Bot Farming"
                      : "Invalid Identity Status"}
                  </span>
                </div>
                <div className="text-xs font-mono text-stone-500 uppercase tracking-widest px-3 py-1 rounded-md bg-white/5 border border-white/10">
                  REJECTED
                </div>
              </div>
            ))}
          </div>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-lime-300/16 bg-lime-400/10 text-lime-300 shadow-[0_0_32px_rgba(163,230,53,0.08)]">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-medium text-white">Network secure</p>
              <p className="text-sm text-stone-400">No blocked identities in the current preview.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
