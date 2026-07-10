/**
 * AI module public API.
 *
 * Other modules should import exclusively from here — never from
 * individual adapter files. Use `getAiProvider()` for the default
 * resilient provider with fallback and retry.
 */

export type {
  AiGenerateInput,
  AiGenerateOutput,
  AiMessage,
  AiProvider,
} from "./types";
export { AiProviderError } from "./types";
export { GeminiAdapter } from "./adapters/gemini";
export { GroqAdapter } from "./adapters/groq";
export { OpenRouterAdapter } from "./adapters/openrouter";
export { MockAdapter } from "./adapters/mock";
export {
  ProviderRegistry,
  getAiProvider,
  resetAiProvider,
} from "./provider-registry";
export type { ProviderRegistryOptions } from "./provider-registry";
export {
  getSystemPrompt,
  resetSystemPromptCache,
  loadSystemPromptFromString,
} from "./system-prompt";
