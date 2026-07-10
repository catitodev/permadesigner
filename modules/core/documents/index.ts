/**
 * Documents module public API.
 */

export type {
  StageResponses,
  ProjectContext,
  WizardStage,
} from "./types";

export {
  isScopeComplete,
  getMissingSections,
  buildScopeDocument,
} from "./scope-document";

export type {
  DesignScopeDocument,
  GoalsSection,
  SiteSurveySection,
  NatureObservation,
  BoundariesResourcesSection,
  DesignDecision,
  SdgAlignmentEntry,
} from "./scope-document";
