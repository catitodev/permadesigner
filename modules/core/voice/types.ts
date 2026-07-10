/**
 * VoiceProvider interface — contract for voice input/output.
 *
 * The conversation wizard and chat UI program against this interface,
 * not against the concrete implementation. When the voice module is
 * enabled (NEXT_PUBLIC_VOICE_ENABLED=true), the web-speech adapter
 * is used. Otherwise, `available` is false and the UI shows the mic
 * button as disabled.
 *
 * Requirements: 10.1, 10.2, 10.3
 */

export interface VoiceProvider {
  /** Whether voice is available in this browser/environment. */
  readonly available: boolean;

  /** Start listening and resolve with the transcribed text. */
  listen(): Promise<string>;

  /** Speak the given text aloud via speech synthesis. */
  speak(text: string): Promise<void>;

  /** Stop any ongoing listening or speaking. */
  stop(): void;
}
