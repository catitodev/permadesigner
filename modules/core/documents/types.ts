/**
 * Core document and wizard types.
 *
 * These interfaces define the contract for the conversation wizard stages
 * and the project context that flows through each stage.
 */

import { AiMessage } from "@/modules/core/ai/types";

/**
 * Key-value map of responses collected within a single wizard stage.
 * Each key corresponds to one of the stage's `requiredFields`.
 */
export interface StageResponses {
  [fieldKey: string]: unknown;
}

/**
 * Full context passed to each stage's `buildPrompt` method.
 * Contains everything the stage needs to construct contextual AI messages.
 */
export interface ProjectContext {
  projectId: string;
  projectName: string;
  currentStageId: string;
  /** All collected responses keyed by stage id. */
  allResponses: Record<string, StageResponses>;
  conversationHistory: AiMessage[];
}

/**
 * Contract for a single wizard stage.
 *
 * Adding a new stage to the wizard = implementing this interface in a new
 * file under `modules/conversation-wizard/stages/` and registering it in
 * the state machine's stage array. No other part of the system needs to change.
 */
export interface WizardStage {
  /** Unique identifier used in DB (`projects.current_stage_id`, `stage_responses.stage_id`). */
  id: string;
  /** English display title. */
  title: string;
  /** Portuguese display title shown in the UI. */
  titlePt: string;
  /** Field keys that must be filled for this stage to be considered complete. */
  requiredFields: string[];
  /** Build the AI prompt messages for this stage given current project context. */
  buildPrompt(context: ProjectContext): AiMessage[];
  /** Check if this stage has enough data to be considered complete. */
  isComplete(responses: StageResponses): boolean;
}
