/**
 * Core AI provider abstractions.
 *
 * Every AI adapter (Gemini, Groq, OpenRouter, Mock) implements `AiProvider`.
 * No other module should depend on a concrete adapter — always import from
 * `modules/core/ai` which re-exports these types and the registry.
 */

export interface AiMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AiGenerateInput {
  messages: AiMessage[];
  /** Knowledge-base objects relevant to this turn (passed as context). */
  knowledgeContext?: unknown;
  /** JSON Schema for structured output (triggers responseMimeType: application/json). */
  responseSchema?: object;
  /** Sampling temperature. Default: 0.3 */
  temperature?: number;
}

export interface AiGenerateOutput {
  text: string;
  /** Raw response object from the underlying provider SDK. */
  raw: unknown;
}

export interface AiProvider {
  readonly name: string;
  generate(input: AiGenerateInput): Promise<AiGenerateOutput>;
}

/**
 * Typed error thrown by AI adapters when a provider call fails.
 * The `provider-registry` catches these to decide whether to retry or fallback.
 */
export class AiProviderError extends Error {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly statusCode?: number,
    public readonly isRetryable: boolean = false,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "AiProviderError";
  }
}
