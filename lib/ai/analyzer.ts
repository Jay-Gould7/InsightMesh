import type { AnalysisCluster, InsightHighlight } from "@/lib/types";
import { requestGeminiJson } from "@/lib/ai/client";

export type SubmissionForAnalysis = {
  id: number;
  supportCount: number;
  createdAt: Date;
  text: string;
};

const themeRules = [
  { theme: "Mobile Experience", keywords: ["mobile", "ios", "android", "phone", "responsive"] },
  { theme: "Onboarding Flow", keywords: ["onboard", "import", "setup", "register", "wallet", "guide"] },
  { theme: "Performance", keywords: ["slow", "speed", "performance", "latency", "confirm", "lag"] },
  { theme: "Incentives", keywords: ["reward", "bonus", "incentive", "points", "airdrop"] },
  { theme: "Documentation", keywords: ["docs", "tutorial", "guide", "learn", "faq"] },
];

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5\s]/g, " ").replace(/\s+/g, " ").trim();
}

function pickTheme(text: string) {
  const normalized = normalize(text);
  for (const rule of themeRules) {
    if (rule.keywords.some((keyword) => normalized.includes(keyword))) {
      return rule.theme;
    }
  }

  return "Product Direction";
}

function summarizeTheme(texts: string[]) {
  return texts
    .map((text) => text.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)[0]
    ?.slice(0, 180) ?? "Community feedback cluster";
}

function buildFallbackClusters(submissions: SubmissionForAnalysis[]): AnalysisCluster[] {
  const groups = new Map<string, SubmissionForAnalysis[]>();

  for (const submission of submissions) {
    const theme = pickTheme(submission.text);
    const current = groups.get(theme) ?? [];
    current.push(submission);
    groups.set(theme, current);
  }

  return [...groups.entries()].map(([theme, items]) => ({
    id: theme.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    theme,
    count: items.length,
    summary: summarizeTheme(items.map((item) => item.text)),
    signal: items.map((item) => item.text).sort((a, b) => b.length - a.length).slice(0, 3),
    submissionIds: items.map((item) => item.id),
  }));
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

function buildHighlights(clusters: AnalysisCluster[], submissions: SubmissionForAnalysis[]): InsightHighlight[] {
  const byId = new Map(submissions.map((submission) => [submission.id, submission]));
  const highlights: InsightHighlight[] = [];

  for (const cluster of clusters) {
    const candidates = cluster.submissionIds
      .map((id) => byId.get(id))
      .filter((value): value is SubmissionForAnalysis => Boolean(value))
      .sort((a, b) => b.text.length - a.text.length || a.createdAt.getTime() - b.createdAt.getTime());

    const winner = candidates[0];
    if (!winner) {
      continue;
    }

    highlights.push({
      submissionId: winner.id,
      title: cluster.theme,
      reason: `Earliest high-signal suggestion in the ${cluster.theme} cluster.`,
      bonusType: "discovery",
      bonusPoints: 12,
    });
  }

  return highlights;
}

export async function analyzeSubmissions(
  title: string,
  prompt: string,
  submissions: SubmissionForAnalysis[],
): Promise<{ clusters: AnalysisCluster[]; duplicates: number[][]; highlights: InsightHighlight[] }> {
  const systemInstruction = [
    "You analyze community product feedback.",
    "Return JSON with clusters, duplicates, and highlights.",
    "Each cluster needs id, theme, count, summary, signal, and submissionIds.",
    "duplicates must be an array of arrays of submission ids.",
    "highlights must include submissionId, title, reason, bonusType, and bonusPoints.",
  ].join(" ");

  const generated = await requestGeminiJson<{
    clusters?: AnalysisCluster[];
    duplicates?: number[][];
    highlights?: InsightHighlight[];
  }>(systemInstruction, JSON.stringify({ title, prompt, submissions }));

  const clusters = generated?.clusters?.length ? generated.clusters : buildFallbackClusters(submissions);
  const duplicates = generated?.duplicates?.length ? generated.duplicates : buildDuplicateGroups(submissions);
  const highlights = generated?.highlights?.length ? generated.highlights : buildHighlights(clusters, submissions);

  return { clusters, duplicates, highlights };
}
