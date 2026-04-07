import type { AnalysisCluster } from "@/lib/types";

export function ClusterChart({ clusters }: { clusters: AnalysisCluster[] }) {
  return (
    <section className="space-y-6">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.35em] text-lime-300/70">Cluster map</p>
        <h3 className="mt-2 text-xl font-semibold text-white">What the crowd is converging on</h3>
      </div>
      <div className="h-px w-full bg-white/10" />
      <div className="space-y-0">
        {clusters.map((cluster) => (
          <div key={cluster.id} className="border-b border-white/10 py-5 last:border-b-0 last:pb-0 first:pt-0">
            <div className="mb-3 flex items-center justify-between gap-4 text-sm text-stone-300">
              <span className="text-base font-medium text-white">{cluster.theme}</span>
              <span>{cluster.count} responses</span>
            </div>
            <div className="h-px w-full bg-white/10" />
            <p className="mt-4 text-sm leading-7 text-stone-400">{cluster.summary}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
