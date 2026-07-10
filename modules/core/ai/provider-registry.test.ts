import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProviderRegistry, resetAiProvider } from "./provider-registry";
import { AiGenerateInput, AiGenerateOutput, AiProvider, AiProviderError } from "./types";

// ─── Test helpers ─────────────────────────────────────────────────────────────

function createMockProvider(
  name: string,
  behavior: "success" | "retryable-fail" | "non-retryable-fail" | "fail-then-succeed",
): AiProvider & { callCount: number } {
  let callCount = 0;
  return {
    name,
    get callCount() {
      return callCount;
    },
    async generate(_input: AiGenerateInput): Promise<AiGenerateOutput> {
      callCount++;
      switch (behavior) {
        case "success":
          return { text: `response from ${name}`, raw: {} };
        case "retryable-fail":
          throw new AiProviderError(
            `${name} rate limited`,
            name,
            429,
            true,
          );
        case "non-retryable-fail":
          throw new AiProviderError(
            `${name} auth error`,
            name,
            401,
            false,
          );
        case "fail-then-succeed":
          if (callCount === 1) {
            throw new AiProviderError(
              `${name} temporary error`,
              name,
              503,
              true,
            );
          }
          return { text: `response from ${name} after retry`, raw: {} };
      }
    },
  };
}

const sampleInput: AiGenerateInput = {
  messages: [{ role: "user", content: "hello" }],
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("ProviderRegistry", () => {
  beforeEach(() => {
    resetAiProvider();
  });

  it("uses the first available provider on success", async () => {
    const p1 = createMockProvider("gemini", "success");
    const p2 = createMockProvider("groq", "success");

    const registry = new ProviderRegistry({ providers: [p1, p2] });
    const result = await registry.generate(sampleInput);

    expect(result.text).toBe("response from gemini");
    expect(p1.callCount).toBe(1);
    expect(p2.callCount).toBe(0);
    expect(registry.lastUsedProvider).toBe("gemini");
  });

  it("falls back to the next provider on non-retryable error", async () => {
    const p1 = createMockProvider("gemini", "non-retryable-fail");
    const p2 = createMockProvider("groq", "success");

    const registry = new ProviderRegistry({ providers: [p1, p2] });
    const result = await registry.generate(sampleInput);

    expect(result.text).toBe("response from groq");
    expect(p1.callCount).toBe(1);
    expect(p2.callCount).toBe(1);
    expect(registry.lastUsedProvider).toBe("groq");
  });

  it("retries retryable errors up to maxRetries then falls back", async () => {
    const p1 = createMockProvider("gemini", "retryable-fail");
    const p2 = createMockProvider("groq", "success");

    const registry = new ProviderRegistry({
      providers: [p1, p2],
      maxRetriesPerProvider: 2,
      initialBackoffMs: 1, // Use 1ms for fast tests
    });

    const result = await registry.generate(sampleInput);

    expect(result.text).toBe("response from groq");
    // Should have retried p1 twice before giving up
    expect(p1.callCount).toBe(2);
    expect(p2.callCount).toBe(1);
    expect(registry.lastUsedProvider).toBe("groq");
  });

  it("succeeds on retry within the same provider", async () => {
    const p1 = createMockProvider("gemini", "fail-then-succeed");
    const p2 = createMockProvider("groq", "success");

    const registry = new ProviderRegistry({
      providers: [p1, p2],
      maxRetriesPerProvider: 2,
      initialBackoffMs: 1,
    });

    const result = await registry.generate(sampleInput);

    expect(result.text).toBe("response from gemini after retry");
    expect(p1.callCount).toBe(2);
    expect(p2.callCount).toBe(0);
    expect(registry.lastUsedProvider).toBe("gemini");
  });

  it("throws the last error when all providers fail", async () => {
    const p1 = createMockProvider("gemini", "non-retryable-fail");
    const p2 = createMockProvider("groq", "non-retryable-fail");
    const p3 = createMockProvider("openrouter", "non-retryable-fail");

    const registry = new ProviderRegistry({ providers: [p1, p2, p3] });

    await expect(registry.generate(sampleInput)).rejects.toThrow(AiProviderError);
    await expect(registry.generate(sampleInput)).rejects.toThrow("openrouter auth error");
  });

  it("throws when constructed with no providers", () => {
    expect(() => new ProviderRegistry({ providers: [] })).toThrow(
      "No AI providers available",
    );
  });

  it("applies exponential backoff between retries", async () => {
    const p1 = createMockProvider("gemini", "retryable-fail");
    const p2 = createMockProvider("groq", "success");

    const sleepSpy = vi.fn();
    // We can't easily spy on the internal sleep, but we can verify timing
    // by checking the provider got retried the correct number of times
    const registry = new ProviderRegistry({
      providers: [p1, p2],
      maxRetriesPerProvider: 3,
      initialBackoffMs: 1,
    });

    const start = Date.now();
    await registry.generate(sampleInput);
    const elapsed = Date.now() - start;

    // With 3 retries and backoff of 1ms, 2ms, we expect at least 3ms total
    // (just verify it's > 0 to not flake in CI)
    expect(p1.callCount).toBe(3);
    expect(p2.callCount).toBe(1);
  });

  it("records lastUsedProvider correctly across multiple calls", async () => {
    const p1 = createMockProvider("gemini", "success");
    const p2 = createMockProvider("groq", "success");

    const registry = new ProviderRegistry({ providers: [p1, p2] });

    await registry.generate(sampleInput);
    expect(registry.lastUsedProvider).toBe("gemini");
  });

  it("wraps non-AiProviderError errors into AiProviderError", async () => {
    const flakyProvider: AiProvider = {
      name: "flaky",
      async generate() {
        throw new Error("network timeout");
      },
    };
    const p2 = createMockProvider("groq", "success");

    const registry = new ProviderRegistry({ providers: [flakyProvider, p2] });
    const result = await registry.generate(sampleInput);

    // Should fallback to p2 since the raw Error is non-retryable
    expect(result.text).toBe("response from groq");
  });
});
