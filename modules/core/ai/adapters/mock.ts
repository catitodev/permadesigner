import {
  AiGenerateInput,
  AiGenerateOutput,
  AiProvider,
} from "../types";

/**
 * Mock AI adapter for testing. Never calls any external API.
 *
 * Behavior:
 * - If custom responses are configured, returns the next one in queue.
 * - If `responseSchema` is provided, returns a minimal valid JSON object
 *   with placeholder values for each property defined in the schema.
 * - Otherwise, echoes the last user message content.
 */
export class MockAdapter implements AiProvider {
  readonly name = "mock";
  private responses: string[] = [];
  private callHistory: AiGenerateInput[] = [];

  /**
   * Create a MockAdapter with optional pre-configured responses.
   * Responses are consumed in order (FIFO). When exhausted, falls back
   * to echo behavior.
   */
  constructor(responses?: string[]) {
    if (responses) {
      this.responses = [...responses];
    }
  }

  /** Add one or more responses to the queue. */
  addResponses(...responses: string[]): void {
    this.responses.push(...responses);
  }

  /** Clear the response queue. */
  clearResponses(): void {
    this.responses = [];
  }

  /** Get all recorded calls for test assertions. */
  getCalls(): AiGenerateInput[] {
    return [...this.callHistory];
  }

  /** Reset call history. */
  resetHistory(): void {
    this.callHistory = [];
  }

  async generate(input: AiGenerateInput): Promise<AiGenerateOutput> {
    this.callHistory.push(input);

    // 1. Return custom response if available
    if (this.responses.length > 0) {
      const text = this.responses.shift()!;
      return { text, raw: { mock: true, customResponse: true } };
    }

    // 2. If responseSchema is provided, return minimal valid JSON
    if (input.responseSchema) {
      const text = JSON.stringify(
        generateMinimalJson(input.responseSchema),
      );
      return { text, raw: { mock: true, schemaGenerated: true } };
    }

    // 3. Echo the last user message
    const lastUserMessage = [...input.messages]
      .reverse()
      .find((m) => m.role === "user");
    const text = lastUserMessage?.content ?? "";

    return { text, raw: { mock: true, echo: true } };
  }
}

/**
 * Generates a minimal valid JSON value from a JSON Schema object.
 * Handles common types: object, array, string, number, boolean.
 */
function generateMinimalJson(schema: object): unknown {
  const s = schema as Record<string, unknown>;

  const type = s.type as string | undefined;

  switch (type) {
    case "object": {
      const result: Record<string, unknown> = {};
      const properties = s.properties as Record<string, object> | undefined;
      if (properties) {
        for (const [key, propSchema] of Object.entries(properties)) {
          result[key] = generateMinimalJson(propSchema);
        }
      }
      return result;
    }
    case "array": {
      const items = s.items as object | undefined;
      if (items) {
        return [generateMinimalJson(items)];
      }
      return [];
    }
    case "string":
      return "";
    case "number":
    case "integer":
      return 0;
    case "boolean":
      return false;
    case "null":
      return null;
    default:
      return {};
  }
}
