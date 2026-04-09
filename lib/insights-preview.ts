import type {
  AnalysisCluster,
  DisqualifiedSubmission,
  InsightHighlight,
  ScoreBreakdownEntry,
} from "@/lib/types";

export const INSIGHTS_PREVIEW_EVENT = "insights-preview-state";

export type InsightsPreviewPayload = {
  clusters: AnalysisCluster[];
  highlights: InsightHighlight[];
  scoreBreakdown: ScoreBreakdownEntry[];
  disqualified?: DisqualifiedSubmission[];
} | null;
