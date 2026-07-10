/**
 * Provider Registry — resilient AI provider with fallback chain and retry.
 *
 * Fallback order: Gemini → Groq → OpenRouter.
 * Each provider is attempted up to `maxRetriesPerProvider` times (only for
 * retryable errors). On exhaustion or non-retryable error, the next provider
 * in the chain is tried. If all providers fail, the last error is thrown.
 *
 * Providers whose API key is missing are silently skipped at construction time
 * so the app doesn't crash when optional keys are absent.
 */

import {
  AiGenerateInput,
  AiGenerateOutput,
  AiProvider,
  AiProviderError,
} from "./types";
import { GeminiAdapter } from "./adapters/gemini";
import { GroqAdapter } from "./adapters/groq";
import { OpenRouterAdapter } from "./adapters/openrouter";

export interface ProviderRegistryOptions {
  /** Maximum retry attempts per provider (default: 2). */
  maxRetriesPerProvider?: number;
  /** Initial backoff delay in ms before first retry (default: 500). */
  initialBackoffMs?: number;
  /** Override providers list (useful for testing). */
  providers?: AiProvider[];
}

/**
 * Sleeps for the given number of milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Attempts to instantiate a provider, returning null if it throws
 * (e.g., missing API key).
 */
function tryCreateProvider<T extends AiProvider>(
  Factory: new () => T,
): T | null {
  try {
    return new Factory();
  } catch {
    // Provider unavailable (missing env var or other config issue) — skip.
    return null;
  }
}

export class ProviderRegistry implements AiProvider {
  readonly name = "registry";

  private readonly providers: AiProvider[];
  private readonly maxRetries: number;
  private readonly initialBackoffMs: number;

  /** Name of the provider that served the last successful request. */
  lastUsedProvider: string | null = null;

  constructor(options?: ProviderRegistryOptions) {
    this.maxRetries = options?.maxRetriesPerProvider ?? 2;
    this.initialBackoffMs = options?.initialBackoffMs ?? 500;

    if (options?.providers) {
      this.providers = options.providers;
    } else {
      // Build fallback chain: Gemini → Groq → OpenRouter
      // Silently skip providers whose API key is not configured.
      this.providers = (
        [
          tryCreateProvider(GeminiAdapter),
          tryCreateProvider(GroqAdapter),
          tryCreateProvider(OpenRouterAdapter),
        ] as (AiProvider | null)[]
      ).filter((p): p is AiProvider => p !== null);
    }

    if (this.providers.length === 0) {
      throw new AiProviderError(
        "No AI providers available. Set at least one API key (GEMINI_API_KEY, GROQ_API_KEY, or OPENROUTER_API_KEY).",
        "registry",
        undefined,
        false,
      );
    }
  }

  async generate(input: AiGenerateInput): Promise<AiGenerateOutput> {
    let lastError: AiProviderError | undefined;

    for (const provider of this.providers) {
      try {
        const result = await this.attemptWithRetry(provider, input);
        this.lastUsedProvider = provider.name;
        return result;
      } catch (error: unknown) {
        lastError =
          error instanceof AiProviderError
            ? error
            : new AiProviderError(
                error instanceof Error ? error.message : "Unknown error",
                provider.name,
                undefined,
                false,
                error,
              );
        // Continue to the next provider in the fallback chain.
      }
    }

    // All providers exhausted — throw the last captured error.
    throw lastError!;
  }

  /**
   * Attempts a single provider with exponential backoff retries.
   * Only retries if the error is marked retryable.
   */
  private async attemptWithRetry(
    provider: AiProvider,
    input: AiGenerateInput,
  ): Promise<AiGenerateOutput> {
    let lastError: AiProviderError | undefined;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        return await provider.generate(input);
      } catch (error: unknown) {
        lastError =
          error instanceof AiProviderError
            ? error
            : new AiProviderError(
                error instanceof Error ? error.message : "Unknown error",
                provider.name,
                undefined,
                false,
                error,
              );

        // Non-retryable errors should not be retried — bail immediately.
        if (!lastError.isRetryable) {
          throw lastError;
        }

        // Wait with exponential backoff before retrying (except after last attempt).
        if (attempt < this.maxRetries - 1) {
          const backoff = this.initialBackoffMs * Math.pow(2, attempt);
          await sleep(backoff);
        }
      }
    }

    // Exhausted all retries for this provider.
    throw lastError!;
  }
}

// ─── Singleton factory ────────────────────────────────────────────────────────

let instance: ProviderRegistry | null = null;

/**
 * Returns a singleton ProviderRegistry instance.
 * Use this as the default entry point for AI generation across the app.
 */
export function getAiProvider(): AiProvider {
  if (!instance) {
    instance = new ProviderRegistry();
  }
  return instance;
}

/**
 * Resets the singleton (useful for testing).
 */
export function resetAiProvider(): void {
  instance = null;
}
