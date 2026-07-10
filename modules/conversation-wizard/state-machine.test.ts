import { describe, it, expect } from "vitest";
import {
  WizardStateMachine,
  DEFAULT_STAGES,
} from "./state-machine";
import { WizardStage, StageResponses } from "@/modules/core/documents/types";

describe("WizardStateMachine", () => {
  describe("constructor", () => {
    it("uses DEFAULT_STAGES when no stages provided", () => {
      const sm = new WizardStateMachine();
      expect(sm.stageCount).toBe(DEFAULT_STAGES.length);
      expect(sm.currentStageId).toBe(DEFAULT_STAGES[0].id);
    });

    it("starts at first stage by default", () => {
      const sm = new WizardStateMachine();
      expect(sm.currentPosition).toBe(0);
    });

    it("starts at the given initialStageId if valid", () => {
      const sm = new WizardStateMachine(undefined, "site-survey");
      expect(sm.currentStageId).toBe("site-survey");
      expect(sm.currentPosition).toBe(1);
    });

    it("falls back to index 0 if initialStageId is invalid", () => {
      const sm = new WizardStateMachine(undefined, "nonexistent-stage");
      expect(sm.currentPosition).toBe(0);
      expect(sm.currentStageId).toBe(DEFAULT_STAGES[0].id);
    });

    it("accepts custom stages array", () => {
      const customStages = DEFAULT_STAGES.slice(0, 2);
      const sm = new WizardStateMachine(customStages);
      expect(sm.stageCount).toBe(2);
    });
  });

  describe("navigation", () => {
    it("advance moves to the next stage", () => {
      const sm = new WizardStateMachine();
      const next = sm.advance();
      expect(next).not.toBeNull();
      expect(sm.currentPosition).toBe(1);
      expect(sm.currentStageId).toBe(DEFAULT_STAGES[1].id);
    });

    it("advance returns null at the last stage", () => {
      const sm = new WizardStateMachine(
        undefined,
        DEFAULT_STAGES[DEFAULT_STAGES.length - 1].id,
      );
      const result = sm.advance();
      expect(result).toBeNull();
      expect(sm.currentPosition).toBe(DEFAULT_STAGES.length - 1);
    });

    it("goBack moves to the previous stage", () => {
      const sm = new WizardStateMachine(undefined, DEFAULT_STAGES[2].id);
      const prev = sm.goBack();
      expect(prev).not.toBeNull();
      expect(sm.currentPosition).toBe(1);
    });

    it("goBack returns null at the first stage", () => {
      const sm = new WizardStateMachine();
      const result = sm.goBack();
      expect(result).toBeNull();
      expect(sm.currentPosition).toBe(0);
    });

    it("goTo jumps to any stage by id (free navigation)", () => {
      const sm = new WizardStateMachine();
      const stage = sm.goTo("sdg-alignment");
      expect(stage).not.toBeNull();
      expect(sm.currentStageId).toBe("sdg-alignment");
    });

    it("goTo returns null for unknown stage id", () => {
      const sm = new WizardStateMachine();
      const result = sm.goTo("unknown-stage");
      expect(result).toBeNull();
      expect(sm.currentPosition).toBe(0); // unchanged
    });

    it("canAdvance is true when not at last stage", () => {
      const sm = new WizardStateMachine();
      expect(sm.canAdvance()).toBe(true);
    });

    it("canAdvance is false at the last stage", () => {
      const sm = new WizardStateMachine(
        undefined,
        DEFAULT_STAGES[DEFAULT_STAGES.length - 1].id,
      );
      expect(sm.canAdvance()).toBe(false);
    });

    it("canGoBack is false at the first stage", () => {
      const sm = new WizardStateMachine();
      expect(sm.canGoBack()).toBe(false);
    });

    it("canGoBack is true when not at first stage", () => {
      const sm = new WizardStateMachine(undefined, DEFAULT_STAGES[1].id);
      expect(sm.canGoBack()).toBe(true);
    });
  });

  describe("completeness and progress", () => {
    it("getNextIncompleteStage returns first incomplete stage", () => {
      const sm = new WizardStateMachine();
      // All empty responses → first stage is incomplete
      const next = sm.getNextIncompleteStage({});
      expect(next).not.toBeNull();
      expect(next!.id).toBe(DEFAULT_STAGES[0].id);
    });

    it("getNextIncompleteStage skips complete stages", () => {
      const sm = new WizardStateMachine();
      // Fill goals stage required fields
      const goalsFields = DEFAULT_STAGES[0].requiredFields;
      const goalsResponses: StageResponses = {};
      for (const field of goalsFields) {
        goalsResponses[field] = "some value";
      }
      const allResponses: Record<string, StageResponses> = {
        [DEFAULT_STAGES[0].id]: goalsResponses,
      };
      const next = sm.getNextIncompleteStage(allResponses);
      expect(next).not.toBeNull();
      expect(next!.id).toBe(DEFAULT_STAGES[1].id);
    });

    it("getNextIncompleteStage returns null when all complete", () => {
      const sm = new WizardStateMachine();
      // Fill all stages
      const allResponses: Record<string, StageResponses> = {};
      for (const stage of DEFAULT_STAGES) {
        const responses: StageResponses = {};
        for (const field of stage.requiredFields) {
          responses[field] = "filled";
        }
        allResponses[stage.id] = responses;
      }
      const next = sm.getNextIncompleteStage(allResponses);
      expect(next).toBeNull();
    });

    it("isAllComplete returns false when some stages incomplete", () => {
      const sm = new WizardStateMachine();
      expect(sm.isAllComplete({})).toBe(false);
    });

    it("isAllComplete returns true when all stages complete", () => {
      const sm = new WizardStateMachine();
      const allResponses: Record<string, StageResponses> = {};
      for (const stage of DEFAULT_STAGES) {
        const responses: StageResponses = {};
        for (const field of stage.requiredFields) {
          responses[field] = "filled";
        }
        allResponses[stage.id] = responses;
      }
      expect(sm.isAllComplete(allResponses)).toBe(true);
    });

    it("getProgress returns correct counts", () => {
      const sm = new WizardStateMachine();
      const progress = sm.getProgress({});
      expect(progress.completed).toBe(0);
      expect(progress.total).toBe(DEFAULT_STAGES.length);
      expect(progress.percentage).toBe(0);
    });

    it("getProgress counts completed stages accurately", () => {
      const sm = new WizardStateMachine();
      // Complete just the first stage
      const goalsResponses: StageResponses = {};
      for (const field of DEFAULT_STAGES[0].requiredFields) {
        goalsResponses[field] = "filled";
      }
      const allResponses: Record<string, StageResponses> = {
        [DEFAULT_STAGES[0].id]: goalsResponses,
      };
      const progress = sm.getProgress(allResponses);
      expect(progress.completed).toBe(1);
      expect(progress.total).toBe(DEFAULT_STAGES.length);
      expect(progress.percentage).toBe(
        Math.round((1 / DEFAULT_STAGES.length) * 100),
      );
    });
  });

  describe("getState", () => {
    it("returns serializable state with currentStageId", () => {
      const sm = new WizardStateMachine(undefined, "nature-patterns");
      const state = sm.getState();
      expect(state.currentStageId).toBe("nature-patterns");
      expect(state.stages).toHaveLength(DEFAULT_STAGES.length);
    });

    it("allStages returns a defensive copy", () => {
      const sm = new WizardStateMachine();
      const stages1 = sm.allStages;
      const stages2 = sm.allStages;
      expect(stages1).not.toBe(stages2);
      expect(stages1).toEqual(stages2);
    });
  });
});
