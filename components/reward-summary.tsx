import { truncateAddress } from "@/lib/utils";

export function RewardSummary({ entries, settlementTx }: { entries: any[]; settlementTx?: string | null }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-lime-300/70">Reward snapshot</p>
        <h3 className="mt-2 text-xl font-semibold text-white">Distribution overview</h3>
      </div>
      <div className="mt-6 space-y-3 text-sm text-stone-300">
        {entries.map((entry) => (
          <div key={entry.id ?? entry.submissionId} className="flex items-center justify-between rounded-2xl border border-white/8 bg-black/10 px-4 py-3">
            <div>
              <p className="font-medium text-white">{truncateAddress(entry.submission?.payoutAddress ?? entry.payoutAddress)}</p>
              <p className="text-xs text-stone-500">submission #{entry.submissionId}</p>
            </div>
            <span className="text-base font-semibold text-lime-200">{entry.rewardAmount} USDT0</span>
          </div>
        ))}
      </div>
      {settlementTx ? <p className="mt-4 text-xs text-stone-500">Settlement tx: {settlementTx}</p> : null}
    </div>
  );
}
