"use client";

/**
 * ChatInterface — main chat container with message list, input area,
 * stage navigation, and fallback form support.
 *
 * Features:
 * - Messages displayed as bubbles (user right, assistant left)
 * - Auto-scroll to bottom on new message
 * - Text input with "Enviar" button (or Enter to send)
 * - Stage indicator at top
 * - Loading indicator shown after 500ms delay (Req 11.4)
 * - Fallback structured form when AI is unavailable (Req 8.2)
 *
 * Requirements: 4.2, 7.3, 7.4, 11.1, 11.2, 11.4, 4.7, 8.2
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChatMessage, TypingIndicator, type ChatMessageData } from "./chat-message";
import { StageNavigation, type StageInfo } from "./stage-navigation";
import { FallbackForm } from "./fallback-form";
import type { GroundingRef } from "./grounding-badge";
import type { FallbackQuestion } from "../fallback-form";
import { enqueueOfflineMessage } from "@/lib/offline/queue";
import { useVoice, type VoiceState } from "@/modules/core/voice";

/** Shape of the /api/chat response. */
interface ChatApiResponse {
  response: string;
  groundingRefs: GroundingRef[];
  stageId: string;
  fallbackMode?: boolean;
  fallbackQuestions?: FallbackQuestion[];
}

export interface ChatInterfaceProps {
  projectId: string;
  projectName: string;
  initialMessages: ChatMessageData[];
  stages: StageInfo[];
  currentStageId: string;
}

export function ChatInterface({
  projectId,
  projectName: _projectName,
  initialMessages,
  stages,
  currentStageId: initialStageId,
}: ChatInterfaceProps) {
  void _projectName; // Reserved for future use (e.g., welcome message)
  const [messages, setMessages] = useState<ChatMessageData[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showTyping, setShowTyping] = useState(false);
  const [currentStageId, setCurrentStageId] = useState(initialStageId);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [fallbackQuestions, setFallbackQuestions] = useState<FallbackQuestion[]>([]);
  const [isFallbackSubmitting, setIsFallbackSubmitting] = useState(false);

  const { available: voiceAvailable, state: voiceState, error: voiceError, startListening, stopListening, stopSpeaking } = useVoice();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Scroll to bottom only within the messages container (not the whole page)
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  // Show typing indicator after 500ms delay (Req 11.4)
  useEffect(() => {
    if (isLoading) {
      typingTimerRef.current = setTimeout(() => {
        setShowTyping(true);
      }, 500);
      return () => {
        if (typingTimerRef.current) {
          clearTimeout(typingTimerRef.current);
          typingTimerRef.current = null;
        }
      };
    }
    // When loading stops, clear typing via a microtask to avoid sync setState in effect
    const raf = requestAnimationFrame(() => {
      setShowTyping(false);
    });
    return () => cancelAnimationFrame(raf);
  }, [isLoading]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      // Add user message to the list immediately
      const userMessage: ChatMessageData = {
        id: `user-${Date.now()}`,
        role: "user",
        content: content.trim(),
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setInputValue("");
      setIsLoading(true);
      setFallbackMode(false);

      try {
        // If offline, queue the message locally
        if (!navigator.onLine) {
          enqueueOfflineMessage(projectId, currentStageId, content.trim());
          const offlineMsg: ChatMessageData = {
            id: `offline-ack-${Date.now()}`,
            role: "assistant",
            content: "📡 Você está offline. Sua mensagem foi salva e será enviada automaticamente quando a conexão voltar.",
            createdAt: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, offlineMsg]);
          setIsLoading(false);
          inputRef.current?.focus();
          return;
        }

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId,
            stageId: currentStageId,
            message: content.trim(),
          }),
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data: ChatApiResponse = await res.json();

        // Check if fallback mode was triggered
        if (data.fallbackMode && data.fallbackQuestions) {
          setFallbackMode(true);
          setFallbackQuestions(data.fallbackQuestions);
        } else {
          // Add assistant message
          const assistantMessage: ChatMessageData = {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: data.response,
            groundingRefs: data.groundingRefs,
            createdAt: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, assistantMessage]);

          // Update stage if it changed
          if (data.stageId && data.stageId !== currentStageId) {
            setCurrentStageId(data.stageId);
          }
        }
      } catch {
        // Show error message from assistant
        const errorMessage: ChatMessageData = {
          id: `error-${Date.now()}`,
          role: "assistant",
          content:
            "Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.",
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
        inputRef.current?.focus();
      }
    },
    [isLoading, projectId, currentStageId],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  const handleStageSelect = (stageId: string) => {
    setCurrentStageId(stageId);
    setFallbackMode(false);
  };

  const handleFallbackSubmit = async (responses: Record<string, string>) => {
    setIsFallbackSubmitting(true);
    try {
      // Submit fallback responses via a message that signals structured data
      const formattedEntries = Object.entries(responses)
        .filter(([, v]) => v.trim())
        .map(([key, value]) => `[${key}]: ${value}`)
        .join("\n");

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          stageId: currentStageId,
          message: formattedEntries,
        }),
      });

      if (res.ok) {
        const data: ChatApiResponse = await res.json();
        // Add a summary message showing what was saved
        const summaryMessage: ChatMessageData = {
          id: `fallback-${Date.now()}`,
          role: "assistant",
          content:
            data.response ||
            "Suas respostas foram salvas com sucesso. Você pode avançar para a próxima etapa.",
          groundingRefs: data.groundingRefs,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, summaryMessage]);
        setFallbackMode(false);

        if (data.stageId && data.stageId !== currentStageId) {
          setCurrentStageId(data.stageId);
        }
      }
    } catch {
      // Keep fallback form visible on error
    } finally {
      setIsFallbackSubmitting(false);
    }
  };

  const currentStageName =
    stages.find((s) => s.id === currentStageId)?.titlePt ?? "Conversa";

  return (
    <div className="flex h-full flex-col" role="region" aria-label="Chat do projeto">
      {/* Stage navigation bar */}
      <div className="shrink-0 border-b border-border">
        <StageNavigation
          stages={stages}
          currentStageId={currentStageId}
          onStageSelect={handleStageSelect}
        />
      </div>

      {/* Stage title */}
      <div className="shrink-0 border-b border-border px-4 py-2">
        <h2 className="text-sm font-medium text-foreground">{currentStageName}</h2>
      </div>

      {/* Messages area */}
      <div
        className="flex-1 overflow-y-auto px-3 py-4 sm:px-4"
        role="log"
        aria-live="polite"
        aria-label="Histórico de mensagens"
      >
        {messages.length === 0 && !fallbackMode && (
          <div className="flex h-full items-center justify-center">
            <p className="text-center text-sm text-muted-foreground">
              Olá! Vamos começar o planejamento do seu projeto.
              <br />
              Digite uma mensagem para iniciar a conversa.
            </p>
          </div>
        )}

        <div className="space-y-3">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}

          {showTyping && <TypingIndicator />}
        </div>

        {/* Fallback form when AI unavailable */}
        {fallbackMode && fallbackQuestions.length > 0 && (
          <div className="mt-4">
            <FallbackForm
              questions={fallbackQuestions}
              stageId={currentStageId}
              projectId={projectId}
              onSubmit={handleFallbackSubmit}
              isSubmitting={isFallbackSubmitting}
            />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="shrink-0 border-t border-border bg-background px-3 py-3 sm:px-4">
        <div className="flex items-center gap-2">
          {/* Voice button — always visible, handles unsupported gracefully */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={`shrink-0 ${
              voiceState === "listening"
                ? "text-red-500 animate-pulse"
                : voiceState === "processing"
                  ? "text-amber-500"
                  : ""
            }`}
            disabled={isLoading}
            onClick={async () => {
              if (!voiceAvailable) {
                // Show friendly message for unsupported browsers
                const noSupportMsg: ChatMessageData = {
                  id: `voice-unsupported-${Date.now()}`,
                  role: "assistant",
                  content: "🎙️ Seu navegador não suporta entrada por voz. Use Chrome ou Edge para essa funcionalidade.",
                  createdAt: new Date().toISOString(),
                };
                setMessages((prev) => [...prev, noSupportMsg]);
                return;
              }
              if (voiceState === "listening") {
                stopListening();
                return;
              }
              stopSpeaking();
              try {
                const transcript = await startListening();
                if (transcript) {
                  sendMessage(transcript);
                }
              } catch {
                // Error already set in voiceError
              }
            }}
            aria-label={
              voiceState === "listening"
                ? "Parar de ouvir"
                : "Falar uma mensagem"
            }
            title={
              voiceState === "listening"
                ? "Ouvindo... clique para parar"
                : voiceState === "processing"
                  ? "Processando..."
                  : "Falar uma mensagem"
            }
          >
            <MicIcon />
          </Button>

          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => { setInputValue(e.target.value); stopSpeaking(); }}
            onKeyDown={handleKeyDown}
            placeholder={voiceState === "listening" ? "Ouvindo..." : "Digite sua mensagem..."}
            disabled={isLoading || voiceState === "listening"}
            className="flex-1"
            aria-label="Campo de mensagem"
          />

          <Button
            type="button"
            onClick={() => sendMessage(inputValue)}
            disabled={!inputValue.trim() || isLoading}
            className="shrink-0 bg-perma-teal hover:bg-perma-teal/90"
            aria-label="Enviar mensagem"
          >
            Enviar
          </Button>
        </div>
        {voiceError && (
          <p className="mt-1 text-xs text-destructive">{voiceError}</p>
        )}
      </div>
    </div>
  );
}

/** Simple microphone SVG icon. */
function MicIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  );
}
