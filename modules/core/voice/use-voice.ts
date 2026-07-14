"use client";

/**
 * React hook for voice input/output.
 *
 * Provides three states: idle, listening, processing.
 * Integrates with the same message flow as text input.
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { WebSpeechProvider } from "./web-speech";
import type { VoiceProvider } from "./types";

export type VoiceState = "idle" | "listening" | "processing";

export function useVoice() {
  const providerRef = useRef<VoiceProvider | null>(null);
  const [state, setState] = useState<VoiceState>("idle");
  const [available, setAvailable] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize only on client
    const provider = new WebSpeechProvider();
    providerRef.current = provider;
    setAvailable(provider.available);
  }, []);

  /**
   * Start listening. Returns the transcribed text on success.
   * Throws on error (caller should handle).
   */
  const startListening = useCallback(async (): Promise<string> => {
    const provider = providerRef.current;
    if (!provider || !provider.available) {
      throw new Error("Voice not available");
    }

    setError(null);
    setState("listening");

    try {
      const transcript = await provider.listen();
      setState("idle");
      return transcript;
    } catch (err: unknown) {
      setState("idle");
      const message = err instanceof Error ? err.message : "Erro de voz";
      setError(message);
      throw err;
    }
  }, []);

  /**
   * Stop listening immediately.
   */
  const stopListening = useCallback(() => {
    providerRef.current?.stop();
    setState("idle");
  }, []);

  /**
   * Speak text aloud. Stops if stopSpeaking is called.
   */
  const speak = useCallback(async (text: string) => {
    const provider = providerRef.current;
    if (!provider || !provider.available) return;
    await provider.speak(text);
  }, []);

  /**
   * Stop any ongoing speech.
   */
  const stopSpeaking = useCallback(() => {
    providerRef.current?.stop();
  }, []);

  return {
    available,
    state,
    error,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  };
}
