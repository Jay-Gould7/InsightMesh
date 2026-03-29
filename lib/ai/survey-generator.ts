import { requestGeminiJson } from "@/lib/ai/client";
import type { SurveyQuestion } from "@/lib/types";

function buildFallbackQuestions(
  prompt: string,
  questionCount: number,
  title?: string,
  description?: string,
): SurveyQuestion[] {
  const subject = title?.trim() || prompt || "the current experience";
  const context = description?.trim() || prompt || title || "this product";

  const templates: SurveyQuestion[] = [
    {
      id: "satisfaction",
      type: "rating",
      label: `How satisfied are you with ${subject}?`,
      helperText: "Rate from 1 to 5.",
      required: true,
    },
    {
      id: "pain-point",
      type: "text",
      label: "What is the biggest friction point you want fixed first?",
      placeholder: "Describe the problem in one or two sentences.",
      required: true,
    },
    {
      id: "focus-area",
      type: "multi_select",
      label: "Which areas need the most attention?",
      options: ["Onboarding", "Mobile UX", "Performance", "Rewards", "Documentation"],
      allowOther: true,
      required: true,
    },
    {
      id: "proposal",
      type: "text",
      label: "What specific change would make the product meaningfully better?",
      placeholder: "Share a concrete suggestion, not just a complaint.",
      required: true,
    },
    {
      id: "priority-segment",
      type: "single_select",
      label: "Which user segment should this bounty prioritize first?",
      options: ["New users", "Active community members", "Power users", "Builders"],
      allowOther: true,
      required: true,
    },
    {
      id: "confidence",
      type: "rating",
      label: `How confident are you that improving ${context} would materially help adoption?`,
      helperText: "Rate from 1 to 5.",
      required: true,
    },
    {
      id: "missing-feature",
      type: "text",
      label: "What important workflow or feature is missing today?",
      placeholder: "Name the missing feature or workflow.",
      required: true,
    },
    {
      id: "success-signal",
      type: "multi_select",
      label: "Which signals would prove this improvement is working?",
      options: ["More retained users", "Higher conversion", "Fewer support issues", "Better sentiment", "More onchain activity"],
      allowOther: true,
      required: true,
    },
  ];

  return templates.slice(0, questionCount);
}

function normalizeGeneratedQuestions(
  questions: SurveyQuestion[] | undefined,
  prompt: string,
  questionCount: number,
  title?: string,
  description?: string,
) {
  const fallback = buildFallbackQuestions(prompt, questionCount, title, description);
  const validQuestions = (questions ?? []).filter((question) => question.id && question.label && question.type);

  if (validQuestions.length >= questionCount) {
    return validQuestions.slice(0, questionCount);
  }

  const merged: SurveyQuestion[] = [];
  const usedIds = new Set<string>();

  for (const question of validQuestions) {
    if (merged.length >= questionCount) {
      break;
    }

    if (usedIds.has(question.id)) {
      continue;
    }

    merged.push(question);
    usedIds.add(question.id);
  }

  for (const question of fallback) {
    if (merged.length >= questionCount) {
      break;
    }

    const id = usedIds.has(question.id) ? `${question.id}-${merged.length + 1}` : question.id;
    merged.push({ ...question, id });
    usedIds.add(id);
  }

  return merged;
}

export async function generateSurvey(
  prompt: string,
  questionCount: number,
  title?: string,
  description?: string,
): Promise<SurveyQuestion[]> {
  const systemInstruction = [
    "You design concise, high-signal product feedback surveys.",
    "Return JSON with a top-level questions array.",
    "Each question needs id, type, label, optional helperText, optional options, optional placeholder, optional allowOther, and required.",
    "Use only rating, single_select, multi_select, or text as the question type.",
    `Produce exactly ${questionCount} questions.`,
    `The questions array length must be exactly ${questionCount}.`,
  ].join(" ");

  const generated = await requestGeminiJson<{ questions?: SurveyQuestion[] }>(
    systemInstruction,
    JSON.stringify({ prompt, title, description, questionCount }),
  );

  return normalizeGeneratedQuestions(generated?.questions, prompt, questionCount, title, description);
}
