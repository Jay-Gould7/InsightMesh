export function summarizeAnswers(answers: Record<string, unknown>) {
  return Object.values(answers)
    .flatMap((value) => {
      if (Array.isArray(value)) return value.map(String);
      if (value == null) return [];
      return [String(value)];
    })
    .map((value) => value.trim())
    .filter(Boolean)
    .join(" • ")
    .slice(0, 280);
}
