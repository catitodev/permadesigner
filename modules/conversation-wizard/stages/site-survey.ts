/**
 * Site Survey stage — second step of the conversation wizard.
 *
 * Collects information about the physical site: location, area,
 * climate zone, and existing features. Corresponds to the "Survey"
 * phase in SADIMET/OBREDIMET/GoSADIM frameworks.
 */

import type {
  WizardStage,
  ProjectContext,
  StageResponses,
} from "@/modules/core/documents/types";
import type { AiMessage } from "@/modules/core/ai/types";

export const siteSurveyStage: WizardStage = {
  id: "site-survey",
  title: "Site Survey",
  titlePt: "Levantamento do Local",
  requiredFields: ["location", "area", "climate", "existingFeatures"],

  buildPrompt(context: ProjectContext): AiMessage[] {
    const existingResponses = context.allResponses["site-survey"] ?? {};
    const answeredFields = Object.keys(existingResponses);

    const systemMessage: AiMessage = {
      role: "system",
      content: [
        "Você é o Companheiro de Design em Permacultura da PermaBrasilis.",
        "Estamos na etapa de Levantamento do Local (Site Survey).",
        "",
        "Contexto de frameworks relevantes:",
        '- SADIMET/OBREDIMET: etapa "Survey" — levantamento completo do local.',
        '- OBREDIMET detalha: "Observe" — observar com todos os sentidos antes de decidir.',
        "- Princípio 1: Observar e Interagir — a base de quase toda decisão de design.",
        "",
        "Seu papel nesta etapa é coletar informações sobre o terreno:",
        "1. location — Localização do terreno (cidade/estado, zona rural/urbana)",
        "2. area — Área aproximada do terreno",
        "3. climate — Características climáticas (zona climática, regime de chuvas)",
        "4. existingFeatures — Elementos já existentes no local (construções, árvores, água, infraestrutura)",
        "",
        "Orientações:",
        "- Faça uma pergunta por vez, de forma acolhedora e em português.",
        "- Confirme o entendimento antes de avançar para o próximo campo.",
        "- Se a resposta for ambígua, peça esclarecimento.",
        "- Incentive o usuário a descrever o que observa, não o que imagina.",
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
        "- Onde fica o terreno? (localização geográfica, zona rural ou urbana)",
        "- Qual é a área aproximada do local?",
        "- Quais são as características climáticas? (temperatura média, chuvas, estações)",
        "- O que já existe no terreno? (construções, árvores, cursos d'água, estradas, cercas)",
      ].join("\n"),
    };

    return [systemMessage, userContextMessage];
  },

  isComplete(responses: StageResponses): boolean {
    return this.requiredFields.every((field) => responses[field] != null);
  },
};
