import { env, hasGeminiAccess } from "@/lib/env";

function extractJson<T>(text: string): T | null {
  const trimmed = text.trim();
  if (!trimmed) {
    return null;
  }

  try {
    return JSON.parse(trimmed) as T;
  } catch {
    // Fall back to extracting the first JSON object or array from mixed output.
  }

  const candidates: Array<[number, number]> = [
    [trimmed.indexOf("{"), trimmed.lastIndexOf("}")],
    [trimmed.indexOf("["), trimmed.lastIndexOf("]")],
  ];

  for (const [start, end] of candidates) {
    if (start === -1 || end === -1 || end <= start) {
      continue;
    }

    try {
      return JSON.parse(trimmed.slice(start, end + 1)) as T;
    } catch {
      continue;
    }
  }

  return null;
}

export async function requestGeminiJson<T>(systemInstruction: string, userPrompt: string): Promise<T | null> {
  if (!hasGeminiAccess()) {
    return null;
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${env.geminiModel}:generateContent?key=${env.geminiApiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemInstruction }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: userPrompt }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      }),
    },
  );

  if (!response.ok) {
    return null;
  }

  const payload = await response.json();
  const text = payload?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text ?? "").join("\n") ?? "";
  return extractJson<T>(text);
}
