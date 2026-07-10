"use client";

/**
 * StageNavigation — horizontal bar showing wizard stage progress.
 *
 * Shows all 6 stages as dots/pills with labels. Current stage is highlighted,
 * completed stages are marked. Clickable to navigate between stages.
 *
 * Requirements: 4.4, 4.5, 11.1, 11.2
 */

import { cn } from "@/lib/utils";

export interface StageInfo {
  id: string;
  titlePt: string;
  isComplete: boolean;
}

interface StageNavigationProps {
  stages: StageInfo[];
  currentStageId: string;
  onStageSelect: (stageId: string) => void;
}

export function StageNavigation({
  stages,
  currentStageId,
  onStageSelect,
}: StageNavigationProps) {
  return (
    <nav
      className="flex w-full items-center gap-1 overflow-x-auto px-2 py-2 sm:gap-2 sm:px-0"
      aria-label="Navegação de etapas do wizard"
    >
      {stages.map((stage, index) => {
        const isCurrent = stage.id === currentStageId;
        const isCompleted = stage.isComplete;

        return (
          <button
            key={stage.id}
            type="button"
            onClick={() => onStageSelect(stage.id)}
            aria-label={`Etapa ${index + 1}: ${stage.titlePt}${isCurrent ? " (atual)" : ""}${isCompleted ? " (completa)" : ""}`}
            aria-current={isCurrent ? "step" : undefined}
            className={cn(
              "group flex shrink-0 flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-center transition-colors",
              "hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isCurrent && "bg-perma-teal/10",
            )}
          >
            {/* Dot indicator */}
            <span
              className={cn(
                "flex size-6 items-center justify-center rounded-full text-xs font-medium transition-colors",
                isCurrent
                  ? "bg-perma-teal text-white"
                  : isCompleted
                    ? "bg-perma-green text-white"
                    : "bg-muted text-muted-foreground",
              )}
            >
              {isCompleted ? "✓" : index + 1}
            </span>

            {/* Label — hidden on very small screens, visible from sm */}
            <span
              className={cn(
                "hidden text-[10px] leading-tight sm:block sm:max-w-[80px] sm:text-[11px]",
                isCurrent
                  ? "font-medium text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {stage.titlePt}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
