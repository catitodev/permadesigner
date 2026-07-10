/**
 * Conversation Wizard module barrel file.
 *
 * Re-exports the state machine and all stages for external consumption.
 */

export { WizardStateMachine, DEFAULT_STAGES } from "./state-machine";
export type { WizardState } from "./state-machine";

export {
  goalsStage,
  siteSurveyStage,
  naturePatternsStage,
  boundariesResourcesStage,
  designDecisionsStage,
  sdgAlignmentStage,
} from "./stages";
