import type { AnalysisCluster, InsightHighlight } from "@/lib/types";
import { requestGeminiJson } from "@/lib/ai/client";

export type SubmissionForAnalysis = {
  id: number;
  createdAt: Date;
  text: string;
};

// Result shape returned by the LLM (and mirrored by fallback)
export type AIAnalysisResult = {
  clusters: AnalysisCluster[];
  duplicates: number[][];
  highlights: InsightHighlight[];
  qualityRatings: Record<number, number>; // submissionId -> 1..5
};

// ────────────────────────────────────────────────────────────────
// Gemini-powered semantic analysis
// ────────────────────────────────────────────────────────────────

const SYSTEM_INSTRUCTION = `You are an expert data analyst specialising in community product feedback.
Given a bounty title, prompt, and an array of submissions (each with id, createdAt, text), perform the following tasks:

1. **Semantic Clustering**: Group submissions that express the same core pain point, suggestion, or topic into clusters. Each cluster must have:
   - id (kebab-case string)
   - theme (short human-readable label)
   - count (number of submissions in the cluster)
   - summary (1-2 sentence description of the cluster's core idea, max 180 chars)
   - signal (up to 3 representative quotes from submissions)
   - submissionIds (array of submission ids belonging to this cluster)
   Every submission must appear in exactly one cluster.

2. **Duplicate Detection**: Identify groups of submissions that are near-identical in meaning. Return an array of arrays of submission ids.

3. **Insight Highlights**: For each cluster, find the submission with the earliest createdAt timestamp. Mark it as a discovery highlight with:
   - submissionId
   - title (the cluster theme)
   - reason (why this submission is highlighted)
   - bonusType: "discovery"
   - bonusPoints: 12

4. **Quality Ratings**: For EVERY submission, evaluate its logic, detail, depth, and actionability. Assign a qualityRating from 1 to 5:
   - 1 = spam, off-topic, or extremely low effort
   - 2 = vague or superficial, but on-topic
   - 3 = adequate feedback with some useful detail
   - 4 = strong, well-reasoned feedback with specific suggestions
   - 5 = exceptional, highly detailed and actionable insight
   Return as an object mapping submissionId (number) to qualityRating (number).

Return a single JSON object with keys: clusters, duplicates, highlights, qualityRatings.
Do NOT include any markdown formatting or code fences. Return ONLY the raw JSON object.`;

export async function analyzeSubmissions(
  title: string,
  prompt: string,
  submissions: SubmissionForAnalysis[],
): Promise<AIAnalysisResult> {
  const generated = await requestGeminiJson<{
    clusters?: AnalysisCluster[];
    duplicates?: number[][];
    highlights?: InsightHighlight[];
    qualityRatings?: Record<number, number>;
  }>(SYSTEM_INSTRUCTION, JSON.stringify({ title, prompt, submissions }));

  const clusters = generated?.clusters?.length
    ? generated.clusters
    : buildFallbackClusters(submissions);

  const duplicates = generated?.duplicates?.length
    ? generated.duplicates
    : buildDuplicateGroups(submissions);

  const highlights = generated?.highlights?.length
    ? generated.highlights
    : buildFallbackHighlights(clusters, submissions);

  const qualityRatings = generated?.qualityRatings
    ? sanitizeQualityRatings(generated.qualityRatings, submissions)
    : buildFallbackQualityRatings(submissions);

  return { clusters, duplicates, highlights, qualityRatings };
}

// ────────────────────────────────────────────────────────────────
// Fallback: quality ratings based on text length when LLM unavailable
// ────────────────────────────────────────────────────────────────

function sanitizeQualityRatings(
  raw: Record<number, number>,
  submissions: SubmissionForAnalysis[],
): Record<number, number> {
  const result: Record<number, number> = {};
  for (const sub of submissions) {
    const rating = Number(raw[sub.id]);
    result[sub.id] = Number.isFinite(rating) ? Math.max(1, Math.min(5, Math.round(rating))) : 2;
  }
  return result;
}

function buildFallbackQualityRatings(submissions: SubmissionForAnalysis[]): Record<number, number> {
  const result: Record<number, number> = {};
  for (const sub of submissions) {
    const wordCount = sub.text.split(/\s+/).filter(Boolean).length;
    // Map word count to 1-5 rating
    if (wordCount < 10) result[sub.id] = 1;
    else if (wordCount < 30) result[sub.id] = 2;
    else if (wordCount < 60) result[sub.id] = 3;
    else if (wordCount < 120) result[sub.id] = 4;
    else result[sub.id] = 5;
  }
  return result;
}

// ────────────────────────────────────────────────────────────────
// Fallback: keyword-based clustering when LLM unavailable
// ────────────────────────────────────────────────────────────────

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5\s]/g, " ").replace(/\s+/g, " ").trim();
}

function buildFallbackClusters(submissions: SubmissionForAnalysis[]): AnalysisCluster[] {
  // Group all into a single "General Feedback" cluster when LLM is unavailable
  if (submissions.length === 0) return [];

  return [{
    id: "general-feedback",
    theme: "General Feedback",
    count: submissions.length,
    summary: submissions[0]?.text.slice(0, 180) ?? "Community feedback cluster",
    signal: submissions.map((s) => s.text).sort((a, b) => b.length - a.length).slice(0, 3),
    submissionIds: submissions.map((s) => s.id),
  }];
}

function buildDuplicateGroups(submissions: SubmissionForAnalysis[]) {
  const groups = new Map<string, number[]>();

  for (const submission of submissions) {
    const key = normalize(submission.text);
    const current = groups.get(key) ?? [];
    current.push(submission.id);
    groups.set(key, current);
  }

  return [...groups.values()].filter((group) => group.length > 1);
}

function buildFallbackHighlights(
  clusters: AnalysisCluster[],
  submissions: SubmissionForAnalysis[],
): InsightHighlight[] {
  const byId = new Map(submissions.map((s) => [s.id, s]));
  const highlights: InsightHighlight[] = [];

  for (const cluster of clusters) {
    const candidates = cluster.submissionIds
      .map((id) => byId.get(id))
      .filter((s): s is SubmissionForAnalysis => Boolean(s))
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    const earliest = candidates[0];
    if (!earliest) continue;

    highlights.push({
      submissionId: earliest.id,
      title: cluster.theme,
      reason: `Earliest submission in the "${cluster.theme}" cluster.`,
      bonusType: "discovery",
      bonusPoints: 12,
    });
  }

  return highlights;
}
