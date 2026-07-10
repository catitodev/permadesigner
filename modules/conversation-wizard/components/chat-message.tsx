"use client";

/**
 * ChatMessage — renders a single message bubble (user or assistant).
 *
 * Assistant messages can include grounding badges showing which knowledge-base
 * items were referenced. User messages are right-aligned, assistant left-aligned.
 *
 * Requirements: 7.3, 7.4, 11.1
 */

import { cn } from "@/lib/utils";
import { GroundingBadge, type GroundingRef } from "./grounding-badge";

export interface ChatMessageData {
  id: string;
  role: "user" | "assistant";
  content: string;
  groundingRefs?: GroundingRef[];
  createdAt?: string;
}

interface ChatMessageProps {
  message: ChatMessageData;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex w-full",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[75%]",
          isUser
            ? "bg-perma-teal text-white rounded-br-sm"
            : "bg-muted text-foreground rounded-bl-sm",
        )}
      >
        {/* Role label for accessibility */}
        <span className="sr-only">
          {isUser ? "Sua mensagem" : "Resposta do assistente"}
        </span>

        <p className="whitespace-pre-wrap">{message.content}</p>

        {/* Grounding badges for assistant messages — deduplicated */}
        {!isUser &&
          message.groundingRefs &&
          message.groundingRefs.length > 0 && (
            <div
              className="mt-2 flex flex-wrap gap-1"
              aria-label="Fontes de fundamentação"
            >
              {message.groundingRefs
                .filter((ref, i, arr) => arr.findIndex(r => r.type === ref.type && String(r.id) === String(ref.id)) === i)
                .map((ref) => (
                  <GroundingBadge key={`${ref.type}-${ref.id}`} ref_={ref} />
                ))}
            </div>
          )}
      </div>
    </div>
  );
}

/**
 * TypingIndicator — animated three dots shown when waiting for assistant response.
 * Only displayed after 500ms delay (handled by the parent component).
 *
 * Requirement: 11.4
 */
export function TypingIndicator() {
  return (
    <div className="flex justify-start" aria-live="polite" aria-label="Assistente digitando">
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-muted px-4 py-3">
        <span className="size-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:0ms]" />
        <span className="size-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:150ms]" />
        <span className="size-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:300ms]" />
      </div>
    </div>
  );
}
