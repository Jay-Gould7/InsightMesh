"use client";

import { useState } from "react";
import { ShieldAlert, ChevronDown, ChevronUp, ShieldCheck } from "lucide-react";
import type { DisqualifiedSubmission } from "@/lib/types";

export function AntiSybilPanel({ disqualified }: { disqualified: DisqualifiedSubmission[] }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!disqualified || disqualified.length === 0) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-lime-400/10 text-lime-400">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <p className="font-medium text-white">Network Secure</p>
          <p className="text-sm text-stone-400">No sybil or bot attacks detected in this cohort.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-rose-500/20 bg-rose-500/5 backdrop-blur-xl overflow-hidden transition-all duration-300">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/20 text-rose-400">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-rose-200">
              Anti-Sybil Wall Blocked {disqualified.length} Threat{disqualified.length > 1 ? "s" : ""}
            </h3>
            <p className="text-sm text-stone-400 mt-1">
              These submissions were automatically disqualified to protect the reward pool.
            </p>
          </div>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-stone-300">
          {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
      </button>

      {isOpen && (
        <div className="px-6 pb-6 pt-2 border-t border-rose-500/10">
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
      )}
    </div>
  );
}
