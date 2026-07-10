/**
 * Boundaries & Resources stage — collects project limits, available resources,
 * constraints, and budget information.
 *
 * Maps to OBREDIMET's "B" (Boundaries) and "R" (Resources) phases,
 * grounded in the three permaculture ethics: Earth Care, People Care, Fair Share.
 */

import type {
  WizardStage,
  ProjectContext,
  StageResponses,
} from "@/modules/core/documents/types";
import type { AiMessage } from "@/modules/core/ai/types";

export const boundariesResourcesStage: WizardStage = {
  id: "boundaries-resources",
  title: "Boundaries & Resources",
  titlePt: "Fronteiras e Recursos",
  requiredFields: ["boundaries", "resources", "constraints", "budget"],

  buildPrompt(context: ProjectContext): AiMessage[] {
    const existingResponses =
      context.allResponses["boundaries-resources"] ?? {};
    const answeredFields = Object.keys(existingResponses);

    const systemMessage: AiMessage = {
      role: "system",
      content: [
        "Você é o Companheiro de Design em Permacultura da PermaBrasilis.",
        "Estamos na etapa de Fronteiras e Recursos.",
        "",
        "Contexto de frameworks relevantes:",
        '- OBREDIMET: "B" = Boundaries (Fronteiras) — limites físicos, legais, sociais e éticos do projeto.',
        '- OBREDIMET: "R" = Resources (Recursos) — o que já está disponível ou pode ser mobilizado.',
        "- As três éticas da permacultura orientam esta reflexão:",
        "  • Cuidado com a Terra — quais limites ecológicos não podem ser ultrapassados?",
        "  • Cuidado com as Pessoas — quais necessidades humanas devem ser atendidas?",
        "  • Partilha Justa — como distribuir excedentes e evitar acumulação?",
        "",
        "Seu papel nesta etapa é ajudar o usuário a mapear:",
        "1. boundaries — Limites do projeto (físicos, legais, temporais, éticos)",
        "2. resources — Recursos disponíveis (humanos, materiais, conhecimento, conexões)",
        "3. constraints — Restrições e limitações conhecidas",
        "4. budget — Orçamento disponível e estratégia financeira",
        "",
        "Orientações:",
        "- Faça uma pergunta por vez, de forma acolhedora e em português.",
        "- Confirme o entendimento antes de avançar para o próximo campo.",
        "- Se a resposta for ambígua, peça esclarecimento.",
        "- Incentive a pensar em recursos não-monetários (mutirão, troca, doação, saberes locais).",
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
        "- Quais são os limites do projeto? (área física, legislação, prazos, limites éticos)",
        "- Que recursos estão disponíveis? (pessoas, materiais, ferramentas, conhecimento local)",
        "- Quais restrições ou limitações já são conhecidas? (clima, solo, vizinhança, regulamentação)",
        "- Qual é o orçamento disponível? Há estratégias de financiamento alternativas (mutirão, permutas, editais)?",
      ].join("\n"),
    };

    return [systemMessage, userContextMessage];
  },

  isComplete(responses: StageResponses): boolean {
    return this.requiredFields.every((field) => responses[field] != null);
  },
};
