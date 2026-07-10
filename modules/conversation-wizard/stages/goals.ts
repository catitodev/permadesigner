/**
 * Goals & Vision stage — first step of the conversation wizard.
 *
 * Collects the user's project vision, main goals, and desired timeframe.
 * Inspired by the GoSADIM framework's "Goal Articulation" phase and
 * Dragon Dreaming's "Dreaming" phase.
 */

import type {
  WizardStage,
  ProjectContext,
  StageResponses,
} from "@/modules/core/documents/types";
import type { AiMessage } from "@/modules/core/ai/types";

export const goalsStage: WizardStage = {
  id: "goals",
  title: "Goals & Vision",
  titlePt: "Objetivos e Sonho do Projeto",
  requiredFields: ["projectVision", "mainGoals", "timeframe"],

  buildPrompt(context: ProjectContext): AiMessage[] {
    const existingResponses = context.allResponses["goals"] ?? {};
    const answeredFields = Object.keys(existingResponses);

    const systemMessage: AiMessage = {
      role: "system",
      content: [
        "Você é o Companheiro de Design em Permacultura da PermaBrasilis.",
        "Estamos na etapa de Objetivos e Sonho do Projeto.",
        "",
        "Contexto de frameworks relevantes:",
        '- GoSADIM: começa com "Goal Articulation" — articulação de metas.',
        '  "Se você não tem um sonho, como vai ter um sonho realizado?" — Graham Burnett.',
        "- Dragon Dreaming: inicia pela fase \"Dreaming\" — sonho coletivo.",
        "",
        "Seu papel nesta etapa é ajudar o usuário a articular:",
        "1. projectVision — O sonho ou visão geral do projeto",
        "2. mainGoals — Os objetivos principais e resultados desejados",
        "3. timeframe — O horizonte de tempo para o projeto",
        "",
        "Orientações:",
        "- Faça uma pergunta por vez, de forma acolhedora e em português.",
        "- Confirme o entendimento antes de avançar para o próximo campo.",
        "- Se a resposta for ambígua, peça esclarecimento.",
        "- Use linguagem acessível; evite jargão técnico excessivo.",
        answeredFields.length > 0
          ? `- Campos já respondidos: ${answeredFields.join(", ")}. Foque nos campos pendentes.`
          : "",
      ]
        .filter(Boolean)
        .join("\n"),
    };

    const userContextMessage: AiMessage = {
      role: "user",
      content: [
        `Projeto: "${context.projectName}"`,
        "",
        "Perguntas orientadoras para esta etapa:",
        "- O que você sonha para este projeto?",
        "- Quais são os objetivos principais que deseja alcançar?",
        "- Em quanto tempo imagina ver os primeiros resultados?",
      ].join("\n"),
    };

    return [systemMessage, userContextMessage];
  },

  isComplete(responses: StageResponses): boolean {
    return this.requiredFields.every((field) => responses[field] != null);
  },
};
