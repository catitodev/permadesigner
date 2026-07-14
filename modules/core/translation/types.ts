/**
 * TranslationProvider interface — contract for translation services.
 *
 * v1: only the interface exists. The Google Cloud Translation implementation
 * will be added when needed (paid API, billed per character).
 *
 * Follows the same adapter pattern as modules/core/ai/.
 * Req: I18N-4
 */

export interface TranslationProvider {
  readonly name: string;

  /**
   * Translate text from one language to another.
   * @param text - The text to translate
   * @param from - Source language code (e.g., "pt", "en", "es")
   * @param to - Target language code
   * @returns Translated text
   */
  translate(text: string, from: string, to: string): Promise<string>;
}
