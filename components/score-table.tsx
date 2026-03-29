export function ScoreTable({ entries }: { entries: any[] }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl">
      <table className="min-w-full divide-y divide-white/10 text-sm">
        <thead className="bg-white/5 text-left text-xs uppercase tracking-[0.3em] text-stone-400">
          <tr>
            <th className="px-4 py-3">Rank</th>
            <th className="px-4 py-3">Submission</th>
            <th className="px-4 py-3">Total</th>
            <th className="px-4 py-3">Reward</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/8 text-stone-200">
          {entries.map((entry, index) => (
            <tr key={entry.id ?? `${entry.submissionId}-${index}`}>
              <td className="px-4 py-4">#{entry.rank ?? index + 1}</td>
              <td className="px-4 py-4">
                <p className="font-medium text-white">{entry.submission?.summary ?? entry.summary}</p>
                <p className="mt-1 text-xs text-stone-400">P {entry.participationPts} · Q {entry.qualityPts} · D {entry.discoveryBonus} · C {entry.consensusBonus}</p>
              </td>
              <td className="px-4 py-4 font-semibold text-lime-200">{entry.totalPoints}</td>
              <td className="px-4 py-4 font-semibold text-white">{entry.rewardAmount ?? "0.00"} USDT0</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
