/**
 * Design Decisions stage — guides the user through key design decisions
 * informed by the 12 Principles of Permaculture.
 *
 * Each decision should be explicitly linked to one or more principles,
 * promoting conscious and principled design thinking.
 */

import type {
  WizardStage,
  ProjectContext,
  StageResponses,
} from "@/modules/core/documents/types";
import type { AiMessage } from "@/modules/core/ai/types";

export const designDecisionsStage: WizardStage = {
  id: "design-decisions",
  title: "Design Decisions (12 Principles)",
  titlePt: "Decisões de Design (12 Princípios)",
  requiredFields: ["keyDecisions", "principlesApplied", "designElements"],

  buildPrompt(context: ProjectContext): AiMessage[] {
    const existingResponses =
      context.allResponses["design-decisions"] ?? {};
    const answeredFields = Object.keys(existingResponses);

    const systemMessage: AiMessage = {
      role: "system",
      content: [
        "Você é o Companheiro de Design em Permacultura da PermaBrasilis.",
        "Estamos na etapa de Decisões de Design, guiada pelos 12 Princípios da Permacultura.",
        "",
        "Os 12 Princípios (David Holmgren):",
        "1. Observar e Interagir",
        "2. Captar e Armazenar Energia",
        "3. Obter um Rendimento",
        "4. Aplicar Autorregulação e Aceitar Feedback",
        "5. Usar e Valorizar Recursos e Serviços Renováveis",
        "6. Não Produzir Resíduos",
        "7. Design a Partir de Padrões para Detalhes",
        "8. Integrar ao Invés de Segregar",
        "9. Usar Soluções Pequenas e Lentas",
        "10. Usar e Valorizar a Diversidade",
        "11. Usar Bordas e Valorizar o Marginal",
        "12. Usar e Responder à Mudança de Forma Criativa",
        "",
        "Seu papel nesta etapa é ajudar o usuário a articular:",
        "1. keyDecisions — Decisões-chave de design já tomadas ou em consideração",
        "2. principlesApplied — Quais princípios orientam cada decisão (relação explícita)",
        "3. designElements — Elementos de design concretos planejados (canteiros, sistemas de água, estruturas, etc.)",
        "",
        "Orientações:",
        "- Faça uma pergunta por vez, de forma acolhedora e em português.",
        "- Confirme o entendimento antes de avançar para o próximo campo.",
        "- Para cada decisão mencionada, pergunte qual princípio a fundamenta.",
        "- Sugira princípios relevantes quando o usuário parecer inseguro.",
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
        "- Quais decisões de design você já tomou ou está considerando para este projeto?",
        "- Quais dos 12 princípios da permacultura orientam essas decisões?",
        "- Que elementos concretos de design você planeja implementar? (Ex: horta em mandala, sistema de captação de água, galinheiro integrado, quebra-vento, etc.)",
      ].join("\n"),
    };

    return [systemMessage, userContextMessage];
  },

  isComplete(responses: StageResponses): boolean {
    return this.requiredFields.every((field) => responses[field] != null);
  },
};
