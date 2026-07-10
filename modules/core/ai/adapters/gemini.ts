import { GoogleGenAI } from "@google/genai";
import type { Content } from "@google/genai";

import {
  AiGenerateInput,
  AiGenerateOutput,
  AiMessage,
  AiProvider,
  AiProviderError,
} from "../types";

const MODEL = "gemini-2.5-flash";
const DEFAULT_TEMPERATURE = 0.3;

/**
 * Converts our AiMessage[] into Gemini's Content[] format.
 *
 * Gemini uses `systemInstruction` (separate config field) for the system role,
 * while user/assistant map to role "user"/"model" in the contents array.
 */
function toGeminiContents(messages: AiMessage[]): {
  systemInstruction: string | undefined;
  contents: Content[];
} {
  let systemInstruction: string | undefined;
  const contents: Content[] = [];

  for (const msg of messages) {
    if (msg.role === "system") {
      // Concatenate multiple system messages (rare, but handle gracefully)
      systemInstruction = systemInstruction
        ? `${systemInstruction}\n\n${msg.content}`
        : msg.content;
    } else {
      contents.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      });
    }
  }

  return { systemInstruction, contents };
}

/**
 * Gemini AI adapter using `@google/genai` SDK.
 *
 * Reads API key from `process.env.GEMINI_API_KEY`.
 */
export class GeminiAdapter implements AiProvider {
  readonly name = "gemini";
  private readonly client: GoogleGenAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new AiProviderError(
        "GEMINI_API_KEY environment variable is not set",
        "gemini",
        undefined,
        false,
      );
    }
    this.client = new GoogleGenAI({ apiKey });
  }

  async generate(input: AiGenerateInput): Promise<AiGenerateOutput> {
    const { systemInstruction, contents } = toGeminiContents(input.messages);
    const temperature = input.temperature ?? DEFAULT_TEMPERATURE;

    try {
      const response = await this.client.models.generateContent({
        model: MODEL,
        contents,
        config: {
          systemInstruction,
          temperature,
          ...(input.responseSchema
            ? {
                responseMimeType: "application/json",
                responseJsonSchema: input.responseSchema,
              }
            : {}),
        },
      });

      const text = response.text ?? "";

      return { text, raw: response };
    } catch (error: unknown) {
      throw this.wrapError(error);
    }
  }

  private wrapError(error: unknown): AiProviderError {
    if (error instanceof AiProviderError) {
      return error;
    }

    const message =
      error instanceof Error ? error.message : "Unknown Gemini API error";

    // Detect retryable errors (rate limits, server errors)
    const statusCode = this.extractStatusCode(error);
    const isRetryable =
      statusCode === 429 ||
      statusCode === 503 ||
      statusCode === 500 ||
      message.toLowerCase().includes("rate limit") ||
      message.toLowerCase().includes("quota");

    return new AiProviderError(
      `Gemini API error: ${message}`,
      "gemini",
      statusCode,
      isRetryable,
      error,
    );
  }

  private extractStatusCode(error: unknown): number | undefined {
    if (
      error &&
      typeof error === "object" &&
      "status" in error &&
      typeof (error as { status: unknown }).status === "number"
    ) {
      return (error as { status: number }).status;
    }
    if (
      error &&
      typeof error === "object" &&
      "statusCode" in error &&
      typeof (error as { statusCode: unknown }).statusCode === "number"
    ) {
      return (error as { statusCode: number }).statusCode;
    }
    return undefined;
  }
}
