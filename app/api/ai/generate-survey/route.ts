import { generateSurvey } from "@/lib/ai/survey-generator";
import { apiError } from "@/lib/api";
import { generateSurveySchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const payload = generateSurveySchema.parse(json);
    const questions = await generateSurvey(payload.prompt, payload.questionCount, payload.title, payload.description);
    return Response.json({ questions });
  } catch (error) {
    return apiError("Unable to generate survey", 400, error);
  }
}
