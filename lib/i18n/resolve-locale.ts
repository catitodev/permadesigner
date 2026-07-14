/**
 * Resolves a localizable field value to a plain string.
 *
 * Knowledge-base fields can be either:
 * - A plain string (legacy pt-BR format)
 * - An object { "pt-BR": "...", "en": "...", "es": "..." }
 *
 * This helper extracts the correct locale text, falling back to pt-BR.
 */

export type LocalizableString = string | Record<string, string>;

export function resolveLocale(
  value: LocalizableString | undefined | null,
  locale: string = "pt-BR",
): string {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return value;
  return value[locale] ?? value["pt-BR"] ?? Object.values(value)[0] ?? "";
}
