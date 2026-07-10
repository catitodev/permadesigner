/**
 * Web Speech API adapter — implements VoiceProvider using native browser APIs.
 *
 * Gated behind NEXT_PUBLIC_VOICE_ENABLED flag. When the flag is false,
 * `available` returns false and all methods are no-ops.
 *
 * Browser support: Chrome/Edge (full), Firefox (partial), Safari (partial).
 * Degrades gracefully — never crashes on unsupported browsers.
 *
 * Requirements: 10.2, 10.3
 */

import type { VoiceProvider } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */

export class WebSpeechProvider implements VoiceProvider {
  private recognition: any = null;
  private synthesis: SpeechSynthesis | null = null;
  private _available: boolean;

  constructor() {
    const enabled = process.env.NEXT_PUBLIC_VOICE_ENABLED === "true";
    const hasSpeechRecognition =
      typeof window !== "undefined" &&
      ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
    const hasSpeechSynthesis =
      typeof window !== "undefined" && "speechSynthesis" in window;

    this._available = enabled && hasSpeechRecognition && hasSpeechSynthesis;

    if (this._available) {
      const SpeechRecognitionClass =
        (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;

      if (SpeechRecognitionClass) {
        this.recognition = new SpeechRecognitionClass();
        this.recognition.lang = "pt-BR";
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
      }

      this.synthesis = window.speechSynthesis;
    }
  }

  get available(): boolean {
    return this._available;
  }

  listen(): Promise<string> {
    if (!this.recognition) {
      return Promise.reject(new Error("Speech recognition not available"));
    }

    return new Promise((resolve, reject) => {
      const rec = this.recognition;

      rec.onresult = (event: any) => {
        const transcript = event.results[0]?.[0]?.transcript ?? "";
        resolve(transcript);
      };

      rec.onerror = (event: any) => {
        reject(new Error(`Speech recognition error: ${event.error}`));
      };

      rec.onend = () => {
        // If no result was captured, resolve with empty string
      };

      rec.start();
    });
  }

  speak(text: string): Promise<void> {
    if (!this.synthesis) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "pt-BR";
      utterance.rate = 0.95;
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve(); // Don't reject on TTS errors
      this.synthesis!.speak(utterance);
    });
  }

  stop(): void {
    this.recognition?.abort();
    this.synthesis?.cancel();
  }
}
