/**
 * Tests for system-prompt loader.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  getSystemPrompt,
  resetSystemPromptCache,
  loadSystemPromptFromString,
} from "./system-prompt";

describe("system-prompt", () => {
  beforeEach(() => {
    resetSystemPromptCache();
  });

  describe("getSystemPrompt", () => {
    it("loads and returns the prompt text from docs/ai-system-prompt.md", () => {
      const prompt = getSystemPrompt();

      // The prompt should contain key phrases from the fenced block
      expect(prompt).toContain("Companheiro de Design em Permacultura");
      expect(prompt).toContain("REGRAS INEGOCIÁVEIS");
      expect(prompt).toContain("CONTEXTO_BASE_CONHECIMENTO");
    });

    it("caches the result on subsequent calls", () => {
      const first = getSystemPrompt();
      const second = getSystemPrompt();

      expect(first).toBe(second);
    });

    it("does not include the markdown fence markers", () => {
      const prompt = getSystemPrompt();

      expect(prompt).not.toMatch(/^```/);
      expect(prompt).not.toMatch(/```$/);
    });
  });

  describe("loadSystemPromptFromString", () => {
    it("extracts the fenced code block from raw markdown", () => {
      const markdown = [
        "# Title",
        "",
        "Some text",
        "",
        "```",
        "This is the prompt content.",
        "It has multiple lines.",
        "```",
        "",
        "More text after.",
      ].join("\n");

      const result = loadSystemPromptFromString(markdown);

      expect(result).toBe(
        "This is the prompt content.\nIt has multiple lines.",
      );
    });

    it("throws when no fenced block is found", () => {
      const markdown = "# Title\n\nNo code block here.";

      expect(() => loadSystemPromptFromString(markdown)).toThrow(
        "Could not extract system prompt",
      );
    });

    it("sets the cache for getSystemPrompt", () => {
      const markdown = "```\nCached prompt text\n```";
      loadSystemPromptFromString(markdown);

      expect(getSystemPrompt()).toBe("Cached prompt text");
    });
  });

  describe("resetSystemPromptCache", () => {
    it("clears the cache so the next call reloads from file", () => {
      // Load from string to set cache
      loadSystemPromptFromString("```\nTest prompt\n```");
      expect(getSystemPrompt()).toBe("Test prompt");

      // Reset and load from actual file
      resetSystemPromptCache();
      const prompt = getSystemPrompt();

      // Should now contain the real file content, not "Test prompt"
      expect(prompt).toContain("Companheiro de Design em Permacultura");
    });
  });
});
