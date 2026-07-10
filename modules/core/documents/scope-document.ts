/**
 * DesignScopeDocument — the structured output of the wizard.
 *
 * This module defines the document shape and provides:
 * - `buildScopeDocument()` — assembles stage responses into a typed document
 * - `isScopeComplete()` — deterministic completeness check (Req 6.2, 6.3, 7.5)
 */

import type { StageResponses } from "./types";
import { DEFAULT_STAGES } from "@/modules/conversation-wizard/state-machine";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GoalsSection {
  projectVision: string;
  mainGoals: string;
  timeframe: string;
}

export interface SiteSurveySection {
  location: string;
  area: string;
  climate: string;
  existingFeatures: string;
}

export interface NatureObservation {
  category: string;
  observation: string;
  designImplication?: string;
  relatedPrincipleIds?: string[];
}

export interface BoundariesResourcesSection {
  boundaries: string;
  resources: string;
  constraints: string;
  budget?: string;
}

export interface DesignDecision {
  principleId?: string;
  decision: string;
}

export interface SdgAlignmentEntry {
  sdgId: string;
  justification: string;
}

export interface DesignScopeDocument {
  projectId: string;
  projectName: string;
  version: number;
  status: "initial" | "complete";
  generatedAt: string;
  sections: {
    goals: GoalsSection | null;
    siteSurvey: SiteSurveySection | null;
    naturePatterns: NatureObservation[];
    boundariesResources: BoundariesResourcesSection | null;
    designDecisions: DesignDecision[];
    sdgAlignment: SdgAlignmentEntry[];
    missingSections?: string[];
  };
}

// ─── Essential stages for "complete" status ───────────────────────────────────

const ESSENTIAL_STAGE_IDS = [
  "goals",
  "site-survey",
  "nature-patterns",
  "boundaries-resources",
  "design-decisions",
  "sdg-alignment",
];

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Deterministic check: is the scope complete?
 *
 * A scope is complete when ALL essential stages have ALL their required fields filled.
 * This function is pure — no AI, no network, no side effects. (Req 7.5)
 */
export function isScopeComplete(
  allResponses: Record<string, StageResponses>,
): boolean {
  for (const stage of DEFAULT_STAGES) {
    if (!ESSENTIAL_STAGE_IDS.includes(stage.id)) continue;
    const responses = allResponses[stage.id] ?? {};
    if (!stage.isComplete(responses)) {
      return false;
    }
  }
  return true;
}

/**
 * Returns the list of stage IDs that are still missing data.
 */
export function getMissingSections(
  allResponses: Record<string, StageResponses>,
): string[] {
  const missing: string[] = [];
  for (const stage of DEFAULT_STAGES) {
    if (!ESSENTIAL_STAGE_IDS.includes(stage.id)) continue;
    const responses = allResponses[stage.id] ?? {};
    if (!stage.isComplete(responses)) {
      missing.push(stage.id);
    }
  }
  return missing;
}

/**
 * Builds a DesignScopeDocument from the collected stage responses.
 */
export function buildScopeDocument(
  projectId: string,
  projectName: string,
  allResponses: Record<string, StageResponses>,
  version: number = 1,
): DesignScopeDocument {
  const goals = allResponses["goals"];
  const siteSurvey = allResponses["site-survey"];
  const naturePatterns = allResponses["nature-patterns"];
  const boundariesResources = allResponses["boundaries-resources"];
  const designDecisions = allResponses["design-decisions"];
  const sdgAlignment = allResponses["sdg-alignment"];

  const complete = isScopeComplete(allResponses);
  const missing = complete ? undefined : getMissingSections(allResponses);

  return {
    projectId,
    projectName,
    version,
    status: complete ? "complete" : "initial",
    generatedAt: new Date().toISOString(),
    sections: {
      goals: goals
        ? {
            projectVision: String(goals.projectVision ?? ""),
            mainGoals: String(goals.mainGoals ?? ""),
            timeframe: String(goals.timeframe ?? ""),
          }
        : null,

      siteSurvey: siteSurvey
        ? {
            location: String(siteSurvey.location ?? ""),
            area: String(siteSurvey.area ?? ""),
            climate: String(siteSurvey.climate ?? ""),
            existingFeatures: String(siteSurvey.existingFeatures ?? ""),
          }
        : null,

      naturePatterns: naturePatterns
        ? Object.entries(naturePatterns).map(([category, observation]) => ({
            category,
            observation: String(observation ?? ""),
          }))
        : [],

      boundariesResources: boundariesResources
        ? {
            boundaries: String(boundariesResources.boundaries ?? ""),
            resources: String(boundariesResources.resources ?? ""),
            constraints: String(boundariesResources.constraints ?? ""),
            budget: boundariesResources.budget
              ? String(boundariesResources.budget)
              : undefined,
          }
        : null,

      designDecisions: designDecisions
        ? [
            {
              decision: String(designDecisions.keyDecisions ?? ""),
              principleId: designDecisions.principlesApplied
                ? String(designDecisions.principlesApplied)
                : undefined,
            },
          ]
        : [],

      sdgAlignment: sdgAlignment
        ? [
            {
              sdgId: String(sdgAlignment.relevantSdgs ?? ""),
              justification: String(sdgAlignment.sdgJustification ?? ""),
            },
          ]
        : [],

      missingSections: missing,
    },
  };
}
