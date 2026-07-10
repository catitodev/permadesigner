/**
 * Input sanitization utilities.
 *
 * Strips potentially dangerous content from user messages before
 * sending them to AI providers. Limits message length to prevent abuse.
 */

const MAX_MESSAGE_LENGTH = 4000;

/**
 * Strips HTML tags and script-like content from user input.
 */
function stripHtmlAndScripts(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "");
}

/**
 * Sanitizes a user message for safe processing.
 * - Strips HTML/script content
 * - Trims whitespace
 * - Enforces max length
 */
export function sanitizeUserMessage(message: string): string {
  const cleaned = stripHtmlAndScripts(message).trim();
  if (cleaned.length > MAX_MESSAGE_LENGTH) {
    return cleaned.slice(0, MAX_MESSAGE_LENGTH);
  }
  return cleaned;
}

/**
 * Masks sensitive data patterns in text (for logging only).
 * Masks: CPF, email addresses, phone numbers, coordinates.
 */
export function maskSensitiveData(text: string): string {
  return text
    // CPF: 000.000.000-00
    .replace(/\d{3}\.\d{3}\.\d{3}-\d{2}/g, "[CPF_MASKED]")
    // Email
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[EMAIL_MASKED]")
    // Phone: (00) 00000-0000 or +55...
    .replace(/(?:\+\d{1,3}\s?)?(?:\(\d{2}\)\s?)?\d{4,5}-?\d{4}/g, "[PHONE_MASKED]")
    // Coordinates: -23.5505, -46.6333
    .replace(/-?\d{1,3}\.\d{4,}/g, "[COORD_MASKED]");
}
