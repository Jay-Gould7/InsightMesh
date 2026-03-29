import type { AnalysisCluster } from "@/lib/types";

export function ClusterChart({ clusters }: { clusters: AnalysisCluster[] }) {
  const max = Math.max(...clusters.map((cluster) => cluster.count), 1);
  return (
    <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-lime-300/70">Cluster map</p>
        <h3 className="mt-2 text-xl font-semibold text-white">What the crowd is converging on</h3>
      </div>
      <div className="space-y-3">
        {clusters.map((cluster) => (
          <div key={cluster.id}>
            <div className="mb-2 flex items-center justify-between text-sm text-stone-300">
              <span>{cluster.theme}</span>
              <span>{cluster.count} responses</span>
            </div>
            <div className="h-3 rounded-full bg-white/8">
              <div className="h-3 rounded-full bg-gradient-to-r from-lime-300 via-emerald-300 to-cyan-300" style={{ width: `${(cluster.count / max) * 100}%` }} />
            </div>
            <p className="mt-2 text-sm leading-6 text-stone-400">{cluster.summary}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
