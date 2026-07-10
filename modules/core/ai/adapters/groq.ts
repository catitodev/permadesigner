import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

import {
  AiGenerateInput,
  AiGenerateOutput,
  AiMessage,
  AiProvider,
  AiProviderError,
} from "../types";

const MODEL = "llama-3.3-70b-versatile";
const DEFAULT_TEMPERATURE = 0.3;
const BASE_URL = "https://api.groq.com/openai/v1";

/**
 * Converts AiMessage[] to OpenAI ChatCompletionMessageParam[].
 * The roles (system, user, assistant) map directly.
 */
function toOpenAIMessages(messages: AiMessage[]): ChatCompletionMessageParam[] {
  return messages.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));
}

/**
 * Groq AI adapter using the OpenAI SDK with Groq's base URL.
 *
 * Reads API key from `process.env.GROQ_API_KEY`.
 */
export class GroqAdapter implements AiProvider {
  readonly name = "groq";
  private readonly client: OpenAI;

  constructor() {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new AiProviderError(
        "GROQ_API_KEY environment variable is not set",
        "groq",
        undefined,
        false,
      );
    }
    this.client = new OpenAI({ apiKey, baseURL: BASE_URL });
  }

  async generate(input: AiGenerateInput): Promise<AiGenerateOutput> {
    const temperature = input.temperature ?? DEFAULT_TEMPERATURE;
    const messages = toOpenAIMessages(input.messages);

    // If responseSchema is provided, inject JSON instruction into system prompt
    // and use response_format json_schema when possible
    if (input.responseSchema) {
      const schemaInstruction = `You MUST respond with valid JSON matching this schema:\n${JSON.stringify(input.responseSchema)}`;
      const hasSystem = messages.some((m) => m.role === "system");
      if (hasSystem) {
        const systemMsg = messages.find((m) => m.role === "system");
        if (systemMsg && "content" in systemMsg && typeof systemMsg.content === "string") {
          systemMsg.content = `${systemMsg.content}\n\n${schemaInstruction}`;
        }
      } else {
        messages.unshift({ role: "system", content: schemaInstruction });
      }
    }

    try {
      const response = await this.client.chat.completions.create({
        model: MODEL,
        messages,
        temperature,
        ...(input.responseSchema
          ? { response_format: { type: "json_object" } }
          : {}),
      });

      const text = response.choices[0]?.message?.content ?? "";

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
      error instanceof Error ? error.message : "Unknown Groq API error";

    const statusCode = this.extractStatusCode(error);
    const isRetryable =
      statusCode === 429 ||
      statusCode === 503 ||
      message.toLowerCase().includes("rate limit");

    return new AiProviderError(
      `Groq API error: ${message}`,
      "groq",
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
