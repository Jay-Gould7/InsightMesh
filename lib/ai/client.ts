import { env, hasGeminiAccess, hasSiliconFlowAccess } from "@/lib/env";

export type AIProvider = "gemini" | "siliconflow";

export type AIJsonResult<T> = {
  data: T | null;
  provider: AIProvider;
  model: string;
  label: string;
};

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

function buildModelLabel(provider: AIProvider, model: string) {
  return `${provider}:${model}`;
}

function getProviderOrder(): AIProvider[] {
  switch (env.aiProviderMode) {
    case "gemini":
      return ["gemini"];
    case "siliconflow":
      return ["siliconflow"];
    default:
      return ["gemini", "siliconflow"];
  }
}

function extractSiliconFlowText(content: unknown): string {
  if (typeof content === "string") {
    return content;
  }

  if (!Array.isArray(content)) {
    return "";
  }

  return content
    .map((part) => {
      if (typeof part === "string") {
        return part;
      }

      if (part && typeof part === "object" && "text" in part && typeof part.text === "string") {
        return part.text;
      }

      return "";
    })
    .join("\n");
}

function shouldDisableSiliconFlowThinking(model: string) {
  const normalized = model.trim().toLowerCase();
  return normalized.startsWith("qwen/qwen3");
}

async function requestGeminiJsonInternal<T>(
  systemInstruction: string,
  userPrompt: string,
): Promise<AIJsonResult<T> | null> {
  if (!hasGeminiAccess()) {
    return null;
  }

  try {
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
    const data = extractJson<T>(text);
    if (!data) {
      return null;
    }

    return {
      data,
      provider: "gemini",
      model: env.geminiModel,
      label: buildModelLabel("gemini", env.geminiModel),
    };
  } catch {
    return null;
  }
}

async function requestSiliconFlowJsonInternal<T>(
  systemInstruction: string,
  userPrompt: string,
): Promise<AIJsonResult<T> | null> {
  if (!hasSiliconFlowAccess()) {
    return null;
  }

  const body: Record<string, unknown> = {
    model: env.siliconFlowModel,
    messages: [
      { role: "system", content: systemInstruction },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.2,
    stream: false,
  };

  if (shouldDisableSiliconFlowThinking(env.siliconFlowModel)) {
    body.enable_thinking = false;
  }

  try {
    const response = await fetch("https://api.siliconflow.cn/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.siliconFlowApiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return null;
    }

    const payload = await response.json();
    const text = extractSiliconFlowText(payload?.choices?.[0]?.message?.content);
    const data = extractJson<T>(text);
    if (!data) {
      return null;
    }

    return {
      data,
      provider: "siliconflow",
      model: String(payload?.model ?? env.siliconFlowModel),
      label: buildModelLabel("siliconflow", String(payload?.model ?? env.siliconFlowModel)),
    };
  } catch {
    return null;
  }
}

export async function requestAiJson<T>(systemInstruction: string, userPrompt: string): Promise<AIJsonResult<T> | null> {
  const requesters: Record<AIProvider, () => Promise<AIJsonResult<T> | null>> = {
    gemini: () => requestGeminiJsonInternal<T>(systemInstruction, userPrompt),
    siliconflow: () => requestSiliconFlowJsonInternal<T>(systemInstruction, userPrompt),
  };

  for (const provider of getProviderOrder()) {
    const result = await requesters[provider]();
    if (result?.data !== null) {
      return result;
    }
  }

  return null;
}

export async function requestGeminiJson<T>(systemInstruction: string, userPrompt: string): Promise<T | null> {
  const result = await requestAiJson<T>(systemInstruction, userPrompt);
  return result?.data ?? null;
}
