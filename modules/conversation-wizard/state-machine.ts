/**
 * Wizard State Machine — manages navigation between conversation stages.
 *
 * Supports free navigation (skip/return), editing previous answers,
 * and explicit current_stage_id tracking (Req 4.4, 4.5).
 */

import { WizardStage, StageResponses } from "@/modules/core/documents/types";
import {
  goalsStage,
  siteSurveyStage,
  naturePatternsStage,
  boundariesResourcesStage,
  designDecisionsStage,
  sdgAlignmentStage,
} from "./stages";

/** Default ordered list of stages (Req 4.1). */
export const DEFAULT_STAGES: WizardStage[] = [
  goalsStage,
  siteSurveyStage,
  naturePatternsStage,
  boundariesResourcesStage,
  designDecisionsStage,
  sdgAlignmentStage,
];

export interface WizardState {
  currentStageId: string;
  stages: WizardStage[];
}

/**
 * WizardStateMachine manages stage navigation with free movement.
 *
 * The current stage is tracked by an explicit index (mapped to `projects.current_stage_id`
 * in the DB), not implicitly derived from the array order. Users can jump to any stage
 * at any time (Req 4.4) and edit previous responses (Req 4.5).
 */
export class WizardStateMachine {
  private stages: WizardStage[];
  private currentIndex: number;

  constructor(stages?: WizardStage[], initialStageId?: string) {
    this.stages = stages ?? DEFAULT_STAGES;
    if (initialStageId) {
      const idx = this.stages.findIndex((s) => s.id === initialStageId);
      this.currentIndex = idx === -1 ? 0 : idx;
    } else {
      this.currentIndex = 0;
    }
  }

  /** The currently active stage. */
  get currentStage(): WizardStage {
    return this.stages[this.currentIndex];
  }

  /** The id of the currently active stage. */
  get currentStageId(): string {
    return this.currentStage.id;
  }

  /** A copy of all registered stages. */
  get allStages(): WizardStage[] {
    return [...this.stages];
  }

  /** Total number of stages. */
  get stageCount(): number {
    return this.stages.length;
  }

  /** Zero-based position of the current stage. */
  get currentPosition(): number {
    return this.currentIndex;
  }

  /** Whether there is a next stage to advance to. */
  canAdvance(): boolean {
    return this.currentIndex < this.stages.length - 1;
  }

  /** Whether there is a previous stage to go back to. */
  canGoBack(): boolean {
    return this.currentIndex > 0;
  }

  /** Advance to the next stage. Returns the new stage or null if already at the end. */
  advance(): WizardStage | null {
    if (!this.canAdvance()) return null;
    this.currentIndex++;
    return this.currentStage;
  }

  /** Go back to the previous stage. Returns the new stage or null if already at the start. */
  goBack(): WizardStage | null {
    if (!this.canGoBack()) return null;
    this.currentIndex--;
    return this.currentStage;
  }

  /**
   * Jump to a specific stage by id (free navigation, Req 4.4).
   * Returns the stage or null if the id is not found.
   */
  goTo(stageId: string): WizardStage | null {
    const idx = this.stages.findIndex((s) => s.id === stageId);
    if (idx === -1) return null;
    this.currentIndex = idx;
    return this.currentStage;
  }

  /**
   * Get the next incomplete stage (first one whose `isComplete` returns false).
   * Useful for suggesting where to go next.
   */
  getNextIncompleteStage(
    allResponses: Record<string, StageResponses>,
  ): WizardStage | null {
    for (const stage of this.stages) {
      const responses = allResponses[stage.id] ?? {};
      if (!stage.isComplete(responses)) {
        return stage;
      }
    }
    return null;
  }

  /** Check if all stages are complete. */
  isAllComplete(allResponses: Record<string, StageResponses>): boolean {
    return this.stages.every((stage) => {
      const responses = allResponses[stage.id] ?? {};
      return stage.isComplete(responses);
    });
  }

  /** Get progress info for UI display. */
  getProgress(allResponses: Record<string, StageResponses>): {
    completed: number;
    total: number;
    percentage: number;
  } {
    const total = this.stages.length;
    const completed = this.stages.filter((stage) => {
      const responses = allResponses[stage.id] ?? {};
      return stage.isComplete(responses);
    }).length;
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { completed, total, percentage };
  }

  /** Serialize current state for persistence. */
  getState(): WizardState {
    return {
      currentStageId: this.currentStageId,
      stages: this.allStages,
    };
  }
}
