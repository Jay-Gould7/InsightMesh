import { truncateAddress } from "@/lib/utils";

export function RewardSummary({
  entries,
  settlementTx,
  eyebrow = "Reward snapshot",
  title = "Distribution overview",
  description,
}: {
  entries: any[];
  settlementTx?: string | null;
  eyebrow?: string;
  title?: string;
  description?: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-lime-300/70">{eyebrow}</p>
        <h3 className="mt-2 text-xl font-semibold text-white">{title}</h3>
        {description ? <p className="mt-3 text-sm leading-7 text-stone-300">{description}</p> : null}
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
