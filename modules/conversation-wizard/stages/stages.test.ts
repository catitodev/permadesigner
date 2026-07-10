import { describe, it, expect } from "vitest";
import { goalsStage } from "./goals";
import { siteSurveyStage } from "./site-survey";
import type { ProjectContext, StageResponses } from "@/modules/core/documents/types";

function makeContext(overrides?: Partial<ProjectContext>): ProjectContext {
  return {
    projectId: "test-project-1",
    projectName: "Sítio Esperança",
    currentStageId: "goals",
    allResponses: {},
    conversationHistory: [],
    ...overrides,
  };
}

describe("goalsStage", () => {
  it("has correct id and required fields", () => {
    expect(goalsStage.id).toBe("goals");
    expect(goalsStage.title).toBe("Goals & Vision");
    expect(goalsStage.titlePt).toBe("Objetivos e Sonho do Projeto");
    expect(goalsStage.requiredFields).toEqual([
      "projectVision",
      "mainGoals",
      "timeframe",
    ]);
  });

  it("buildPrompt returns AiMessage[] with system and user messages", () => {
    const messages = goalsStage.buildPrompt(makeContext());
    expect(messages).toHaveLength(2);
    expect(messages[0].role).toBe("system");
    expect(messages[1].role).toBe("user");
    expect(messages[0].content).toContain("Objetivos e Sonho do Projeto");
    expect(messages[0].content).toContain("GoSADIM");
    expect(messages[1].content).toContain("Sítio Esperança");
  });

  it("buildPrompt includes already-answered fields context", () => {
    const context = makeContext({
      allResponses: {
        goals: { projectVision: "Uma floresta de alimentos" },
      },
    });
    const messages = goalsStage.buildPrompt(context);
    expect(messages[0].content).toContain("projectVision");
  });

  it("isComplete returns false when required fields are missing", () => {
    const incomplete: StageResponses = { projectVision: "minha visão" };
    expect(goalsStage.isComplete(incomplete)).toBe(false);
  });

  it("isComplete returns false for empty responses", () => {
    expect(goalsStage.isComplete({})).toBe(false);
  });

  it("isComplete returns true when all required fields are present", () => {
    const complete: StageResponses = {
      projectVision: "Uma floresta de alimentos diversificada",
      mainGoals: "Produzir alimentos, regenerar o solo",
      timeframe: "5 anos",
    };
    expect(goalsStage.isComplete(complete)).toBe(true);
  });
});

describe("siteSurveyStage", () => {
  it("has correct id and required fields", () => {
    expect(siteSurveyStage.id).toBe("site-survey");
    expect(siteSurveyStage.title).toBe("Site Survey");
    expect(siteSurveyStage.titlePt).toBe("Levantamento do Local");
    expect(siteSurveyStage.requiredFields).toEqual([
      "location",
      "area",
      "climate",
      "existingFeatures",
    ]);
  });

  it("buildPrompt returns AiMessage[] with system and user messages", () => {
    const messages = siteSurveyStage.buildPrompt(
      makeContext({ currentStageId: "site-survey" }),
    );
    expect(messages).toHaveLength(2);
    expect(messages[0].role).toBe("system");
    expect(messages[1].role).toBe("user");
    expect(messages[0].content).toContain("Levantamento do Local");
    expect(messages[0].content).toContain("SADIMET");
    expect(messages[1].content).toContain("Onde fica o terreno");
  });

  it("buildPrompt includes already-answered fields context", () => {
    const context = makeContext({
      currentStageId: "site-survey",
      allResponses: {
        "site-survey": { location: "Minas Gerais, zona rural" },
      },
    });
    const messages = siteSurveyStage.buildPrompt(context);
    expect(messages[0].content).toContain("location");
  });

  it("isComplete returns false when required fields are missing", () => {
    const incomplete: StageResponses = {
      location: "Minas Gerais",
      area: "2 hectares",
    };
    expect(siteSurveyStage.isComplete(incomplete)).toBe(false);
  });

  it("isComplete returns false for empty responses", () => {
    expect(siteSurveyStage.isComplete({})).toBe(false);
  });

  it("isComplete returns true when all required fields are present", () => {
    const complete: StageResponses = {
      location: "Zona rural, Minas Gerais",
      area: "2 hectares",
      climate: "Tropical de altitude, chuvas de outubro a março",
      existingFeatures: "Uma nascente, pomar antigo de manga e jabuticaba",
    };
    expect(siteSurveyStage.isComplete(complete)).toBe(true);
  });
});
