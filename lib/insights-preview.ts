import type {
  AnalysisCluster,
  DisqualifiedSubmission,
  InsightHighlight,
  ScoreBreakdownEntry,
} from "@/lib/types";

export const INSIGHTS_PREVIEW_EVENT = "insights-preview-state";
export const INSIGHTS_MANUAL_BLOCK_EVENT = "insights-manual-block-state";

export type InsightsPreviewPayload = {
  clusters: AnalysisCluster[];
  highlights: InsightHighlight[];
  scoreBreakdown: ScoreBreakdownEntry[];
  disqualified?: DisqualifiedSubmission[];
} | null;

export type InsightsManualBlockPayload = {
  blockedSubmissionIds: number[];
};
