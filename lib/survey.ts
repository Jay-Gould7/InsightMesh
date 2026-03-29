import type { SurveyQuestion, SurveyQuestionType } from "@/lib/types";

export const OTHER_OPTION_VALUE = "__other__";

export const QUESTION_TYPE_OPTIONS: Array<{ value: SurveyQuestionType; label: string }> = [
  { value: "text", label: "Text input" },
  { value: "single_select", label: "Single select" },
  { value: "multi_select", label: "Multi select" },
  { value: "rating", label: "Rating 1-5" },
];

const selectTypes = new Set<SurveyQuestionType>(["single_select", "multi_select"]);

export function isSelectQuestionType(type: SurveyQuestionType) {
  return selectTypes.has(type);
}

export function formatQuestionTypeLabel(type: SurveyQuestionType) {
  return QUESTION_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? type;
}

export function createQuestionId() {
  return `question-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createBlankQuestion(type: SurveyQuestionType = "text"): SurveyQuestion {
  if (type === "rating") {
    return {
      id: createQuestionId(),
      type,
      label: "",
      helperText: "Rate from 1 to 5.",
      required: true,
    };
  }

  if (type === "text") {
    return {
      id: createQuestionId(),
      type,
      label: "",
      placeholder: "Share your answer...",
      required: true,
    };
  }

  return {
    id: createQuestionId(),
    type,
    label: "",
    options: ["Option 1", "Option 2"],
    allowOther: true,
    required: true,
  };
}

export function normalizeSurveyQuestion(question: SurveyQuestion): SurveyQuestion {
  const normalized: SurveyQuestion = {
    id: question.id || createQuestionId(),
    type: question.type,
    label: question.label?.trim() ?? "",
    helperText: question.helperText?.trim() || undefined,
    required: question.required ?? true,
  };

  if (question.type === "text") {
    return {
      ...normalized,
      placeholder: question.placeholder?.trim() || "Share your answer...",
    };
  }

  if (question.type === "rating") {
    return normalized;
  }

  return {
    ...normalized,
    options: (question.options ?? []).map((option) => option.trim()).filter(Boolean),
    allowOther: question.allowOther ?? true,
  };
}

export function sanitizeSurveyQuestions(questions: SurveyQuestion[]) {
  return questions.map((question) => normalizeSurveyQuestion(question));
}

export function validateSurveyQuestions(questions: SurveyQuestion[]) {
  if (questions.length < 3) {
    return "Add at least 3 questions before publishing.";
  }

  const ids = new Set<string>();

  for (let index = 0; index < questions.length; index += 1) {
    const question = normalizeSurveyQuestion(questions[index]);

    if (!question.id || ids.has(question.id)) {
      return `Question ${index + 1} needs a unique id.`;
    }

    ids.add(question.id);

    if (!question.label) {
      return `Question ${index + 1} needs a prompt.`;
    }

    if (isSelectQuestionType(question.type) && (question.options?.length ?? 0) < 2) {
      return `Question ${index + 1} needs at least 2 options.`;
    }
  }

  return null;
}

export function prepareSurveyAnswers(
  questions: SurveyQuestion[],
  answers: Record<string, unknown>,
  otherAnswers: Record<string, string>,
) {
  const normalized: Record<string, unknown> = {};

  for (const question of questions.map((item) => normalizeSurveyQuestion(item))) {
    if (question.type === "rating") {
      const value = typeof answers[question.id] === "number" ? answers[question.id] : Number(answers[question.id]);
      if (!Number.isFinite(value)) {
        if (question.required) {
          return { error: `Please answer: ${question.label}` };
        }
        continue;
      }

      normalized[question.id] = value;
      continue;
    }

    if (question.type === "text") {
      const value = String(answers[question.id] ?? "").trim();
      if (!value) {
        if (question.required) {
          return { error: `Please answer: ${question.label}` };
        }
        continue;
      }

      normalized[question.id] = value;
      continue;
    }

    if (question.type === "single_select") {
      const selected = typeof answers[question.id] === "string" ? answers[question.id] as string : "";
      if (!selected) {
        if (question.required) {
          return { error: `Please choose an option for: ${question.label}` };
        }
        continue;
      }

      if (selected === OTHER_OPTION_VALUE) {
        const otherValue = otherAnswers[question.id]?.trim() ?? "";
        if (!otherValue) {
          return { error: `Please fill in the Other field for: ${question.label}` };
        }

        normalized[question.id] = `Other: ${otherValue}`;
        continue;
      }

      normalized[question.id] = selected;
      continue;
    }

    const selectionSource = Array.isArray(answers[question.id]) ? answers[question.id] as unknown[] : [];
    const selections = selectionSource.map((value) => String(value)).filter((value) => Boolean(value));
    if (!selections.length) {
      if (question.required) {
        return { error: `Please choose at least one option for: ${question.label}` };
      }
      continue;
    }

    const values = selections.filter((value) => value !== OTHER_OPTION_VALUE);
    if (selections.includes(OTHER_OPTION_VALUE)) {
      const otherValue = otherAnswers[question.id]?.trim() ?? "";
      if (!otherValue) {
        return { error: `Please fill in the Other field for: ${question.label}` };
      }
      values.push(`Other: ${otherValue}`);
    }

    normalized[question.id] = values;
  }

  return { answers: normalized };
}
