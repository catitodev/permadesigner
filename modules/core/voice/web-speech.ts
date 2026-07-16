/**
 * Web Speech API adapter — full implementation of VoiceProvider.
 *
 * Uses SpeechRecognition for listen() and SpeechSynthesis for speak().
 * Gated behind NEXT_PUBLIC_VOICE_ENABLED — but the real gate is browser support:
 * if the browser doesn't support the APIs, `available` is false and the UI hides the mic.
 *
 * Requirements: 10.2, 10.3
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { VoiceProvider } from "./types";

const LISTEN_TIMEOUT_MS = 10_000; // 10s without speech → reject

export class WebSpeechProvider implements VoiceProvider {
  private recognition: any = null;
  private synthesis: SpeechSynthesis | null = null;
  private _available: boolean;
  private _listening = false;

  constructor() {
    if (typeof window === "undefined") {
      this._available = false;
      return;
    }

    // Voice is available if browser supports it.
    // The env flag acts as a kill switch (if explicitly "false", disable).
    const killSwitch = process.env.NEXT_PUBLIC_VOICE_ENABLED === "false";
    const SpeechRecognitionClass =
      (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    const hasSynthesis = "speechSynthesis" in window;

    this._available = !killSwitch && !!SpeechRecognitionClass && hasSynthesis;

    if (this._available) {
      this.recognition = new SpeechRecognitionClass();
      this.recognition.lang = "pt-BR";
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.maxAlternatives = 1;
      this.synthesis = window.speechSynthesis;
    }
  }

  get available(): boolean {
    return this._available;
  }

  get listening(): boolean {
    return this._listening;
  }

  /**
   * Start listening via microphone. Resolves with transcribed text.
   * Rejects on: permission denied, timeout, or unsupported browser.
   */
  listen(): Promise<string> {
    if (!this.recognition || !this._available) {
      return Promise.reject(new Error("Speech recognition not available"));
    }

    if (this._listening) {
      return Promise.reject(new Error("Already listening"));
    }

    return new Promise<string>((resolve, reject) => {
      this._listening = true;
      let settled = false;

      // Timeout: if no speech detected in 10s
      const timeout = setTimeout(() => {
        if (!settled) {
          settled = true;
          this._listening = false;
          this.recognition.abort();
          reject(new Error("Nenhuma fala detectada. Tente novamente."));
        }
      }, LISTEN_TIMEOUT_MS);

      this.recognition.onresult = (event: any) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        this._listening = false;
        const transcript: string = event.results[0]?.[0]?.transcript ?? "";
        resolve(transcript.trim());
      };

      this.recognition.onerror = (event: any) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        this._listening = false;

        const errorMap: Record<string, string> = {
          "not-allowed": "Permissão de microfone negada. Habilite nas configurações do navegador.",
          "no-speech": "Nenhuma fala detectada. Tente novamente.",
          "audio-capture": "Nenhum microfone encontrado.",
          "network": "Erro de rede na transcrição.",
        };

        const message = errorMap[event.error] ?? `Erro de voz: ${event.error}`;
        reject(new Error(message));
      };

      this.recognition.onend = () => {
        // If ended without result or error (e.g., silence)
        if (!settled) {
          settled = true;
          clearTimeout(timeout);
          this._listening = false;
          reject(new Error("Nenhuma fala detectada. Tente novamente."));
        }
      };

      try {
        this.recognition.start();
      } catch (err: any) {
        settled = true;
        clearTimeout(timeout);
        this._listening = false;
        reject(new Error(err?.message ?? "Falha ao iniciar reconhecimento de voz"));
      }
    });
  }

  /**
   * Speak the given text aloud. Resolves when speech ends.
   * Can be interrupted via stop().
   */
  speak(text: string): Promise<void> {
    if (!this.synthesis || !this._available) {
      return Promise.resolve();
    }

    // Cancel any ongoing speech first
    this.synthesis.cancel();

    return new Promise<void>((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "pt-BR";
      utterance.rate = 0.95;
      utterance.pitch = 1;
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve(); // Don't reject — graceful degradation
      this.synthesis!.speak(utterance);
    });
  }

  /**
   * Stop any ongoing listening or speaking immediately.
   */
  stop(): void {
    if (this._listening) {
      this._listening = false;
      this.recognition?.abort();
    }
    this.synthesis?.cancel();
  }
}
