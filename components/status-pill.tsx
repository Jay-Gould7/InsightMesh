import { cn } from "@/lib/utils";

const toneByStatus: Record<string, string> = {
  PENDING_FUNDING: "bg-amber-500/15 text-amber-200 ring-amber-400/30",
  ACTIVE: "bg-lime-500/15 text-lime-100 ring-lime-400/30",
  ANALYZING: "bg-sky-500/15 text-sky-100 ring-sky-400/30",
  READY_TO_SETTLE: "bg-fuchsia-500/15 text-fuchsia-100 ring-fuchsia-400/30",
  SETTLED: "bg-emerald-500/15 text-emerald-100 ring-emerald-400/30",
  CANCELLED: "bg-stone-500/15 text-stone-100 ring-stone-400/30",
};

export function StatusPill({ status }: { status: string }) {
  return <span className={cn("inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] ring-1", toneByStatus[status] ?? "bg-white/10 text-white ring-white/20")}>{status.replaceAll("_", " ")}</span>;
}
