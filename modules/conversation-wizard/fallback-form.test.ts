/**
 * Tests for structured form fallback.
 */

import { describe, it, expect } from "vitest";
import {
  getFallbackQuestions,
  getFallbackStageIds,
  FallbackQuestion,
} from "./fallback-form";

describe("fallback-form", () => {
  describe("getFallbackQuestions", () => {
    it("returns questions for the goals stage", () => {
      const questions = getFallbackQuestions("goals");

      expect(questions.length).toBeGreaterThan(0);
      expect(questions.map((q) => q.fieldKey)).toContain("projectVision");
      expect(questions.map((q) => q.fieldKey)).toContain("mainGoals");
      expect(questions.map((q) => q.fieldKey)).toContain("timeframe");
    });

    it("returns questions for the site-survey stage", () => {
      const questions = getFallbackQuestions("site-survey");

      expect(questions.length).toBe(4);
      expect(questions.map((q) => q.fieldKey)).toEqual([
        "location",
        "area",
        "climate",
        "existingFeatures",
      ]);
    });

    it("returns questions for the nature-patterns stage", () => {
      const questions = getFallbackQuestions("nature-patterns");

      expect(questions.length).toBeGreaterThanOrEqual(5);
      expect(questions.map((q) => q.fieldKey)).toContain("sunShade");
      expect(questions.map((q) => q.fieldKey)).toContain("water");
      expect(questions.map((q) => q.fieldKey)).toContain("wind");
    });

    it("returns questions for the boundaries-resources stage", () => {
      const questions = getFallbackQuestions("boundaries-resources");

      expect(questions.length).toBe(3);
      expect(questions.map((q) => q.fieldKey)).toContain("boundaries");
      expect(questions.map((q) => q.fieldKey)).toContain("availableResources");
    });

    it("returns questions for the design-decisions stage", () => {
      const questions = getFallbackQuestions("design-decisions");

      expect(questions.length).toBe(3);
      const selectQuestion = questions.find(
        (q) => q.inputType === "select",
      ) as FallbackQuestion;
      expect(selectQuestion).toBeDefined();
      expect(selectQuestion.options).toBeDefined();
      expect(selectQuestion.options!.length).toBeGreaterThan(0);
    });

    it("returns questions for the sdg-alignment stage", () => {
      const questions = getFallbackQuestions("sdg-alignment");

      expect(questions.length).toBe(2);
      expect(questions.map((q) => q.fieldKey)).toContain("relevantSdgs");
      expect(questions.map((q) => q.fieldKey)).toContain("sdgJustification");
    });

    it("returns an empty array for an unknown stage", () => {
      const questions = getFallbackQuestions("nonexistent-stage");
      expect(questions).toEqual([]);
    });

    it("all questions have required fields populated", () => {
      const stageIds = getFallbackStageIds();

      for (const stageId of stageIds) {
        const questions = getFallbackQuestions(stageId);
        for (const q of questions) {
          expect(q.fieldKey).toBeTruthy();
          expect(q.label).toBeTruthy();
          expect(q.placeholder).toBeTruthy();
          expect(["text", "textarea", "select"]).toContain(q.inputType);
          expect(typeof q.required).toBe("boolean");
        }
      }
    });

    it("select-type questions always have options defined", () => {
      const stageIds = getFallbackStageIds();

      for (const stageId of stageIds) {
        const questions = getFallbackQuestions(stageId);
        const selects = questions.filter((q) => q.inputType === "select");
        for (const q of selects) {
          expect(q.options).toBeDefined();
          expect(q.options!.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe("getFallbackStageIds", () => {
    it("returns all stage IDs that have fallback questions", () => {
      const ids = getFallbackStageIds();

      expect(ids).toContain("goals");
      expect(ids).toContain("site-survey");
      expect(ids).toContain("nature-patterns");
      expect(ids).toContain("boundaries-resources");
      expect(ids).toContain("design-decisions");
      expect(ids).toContain("sdg-alignment");
    });

    it("covers all 6 wizard stages", () => {
      const ids = getFallbackStageIds();
      expect(ids.length).toBe(6);
    });
  });
});
