import { generateSurvey } from "@/lib/ai/survey-generator";
import { apiError } from "@/lib/api";
import { generateSurveySchema } from "@/lib/validators";
import { ZodError } from "zod";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const payload = generateSurveySchema.parse(json);
    const questions = await generateSurvey(payload.prompt, payload.questionCount, payload.title, payload.description);
    return Response.json({ questions });
  } catch (error) {
    if (error instanceof ZodError) {
      const issues = error.issues.map((issue) => `${issue.path.join(".")} - ${issue.message}`).join("; ");
      return apiError(`Unable to generate survey: ${issues}`, 400, error);
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    return apiError(`Unable to generate survey: ${message}`, 400, error);
  }
}
