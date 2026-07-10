/**
 * System Prompt Loader.
 *
 * Loads and caches the AI system prompt from `docs/ai-system-prompt.md`.
 * The prompt is the text content between the triple-backtick fenced block
 * in that markdown file. It doesn't change at runtime, so we cache it
 * after the first read.
 */

import { readFileSync } from "fs";
import { resolve } from "path";

/** Cached prompt text — populated on first call to `getSystemPrompt()`. */
let cachedPrompt: string | null = null;

/**
 * Extracts the fenced code block content from the system prompt markdown file.
 * The prompt lives between the first pair of triple backticks (```) in the file.
 */
function extractPromptFromMarkdown(markdown: string): string {
  const fencePattern = /```\n([\s\S]*?)```/;
  const match = fencePattern.exec(markdown);
  if (!match || !match[1]) {
    throw new Error(
      "Could not extract system prompt: no fenced code block found in docs/ai-system-prompt.md",
    );
  }
  return match[1].trim();
}

/**
 * Returns the permaculture companion system prompt text.
 *
 * The text is loaded from `docs/ai-system-prompt.md` (the content inside
 * the triple-backtick block) and cached after the first call.
 */
export function getSystemPrompt(): string {
  if (cachedPrompt !== null) {
    return cachedPrompt;
  }

  const filePath = resolve(process.cwd(), "docs/ai-system-prompt.md");
  const raw = readFileSync(filePath, "utf-8");
  cachedPrompt = extractPromptFromMarkdown(raw);
  return cachedPrompt;
}

/**
 * Resets the cached prompt. Useful for testing.
 */
export function resetSystemPromptCache(): void {
  cachedPrompt = null;
}

/**
 * Loads the system prompt from a raw markdown string (for testing without filesystem).
 * Sets the cache so subsequent calls to `getSystemPrompt()` return this value.
 */
export function loadSystemPromptFromString(markdown: string): string {
  cachedPrompt = extractPromptFromMarkdown(markdown);
  return cachedPrompt;
}
