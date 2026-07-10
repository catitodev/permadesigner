/**
 * SDG Alignment stage — maps the project to the 17 UN Sustainable
 * Development Goals (Objetivos de Desenvolvimento Sustentável — ODS).
 *
 * Helps the user identify which SDGs the project contributes to
 * and articulate clear justifications for each alignment.
 */

import type {
  WizardStage,
  ProjectContext,
  StageResponses,
} from "@/modules/core/documents/types";
import type { AiMessage } from "@/modules/core/ai/types";

export const sdgAlignmentStage: WizardStage = {
  id: "sdg-alignment",
  title: "SDG Alignment",
  titlePt: "Alinhamento com os ODS",
  requiredFields: ["relevantSdgs", "sdgJustification"],

  buildPrompt(context: ProjectContext): AiMessage[] {
    const existingResponses = context.allResponses["sdg-alignment"] ?? {};
    const answeredFields = Object.keys(existingResponses);

    const systemMessage: AiMessage = {
      role: "system",
      content: [
        "Você é o Companheiro de Design em Permacultura da PermaBrasilis.",
        "Estamos na etapa de Alinhamento com os ODS (Objetivos de Desenvolvimento Sustentável).",
        "",
        "Os 17 ODS da ONU:",
        "1. Erradicação da Pobreza",
        "2. Fome Zero e Agricultura Sustentável",
        "3. Saúde e Bem-Estar",
        "4. Educação de Qualidade",
        "5. Igualdade de Gênero",
        "6. Água Potável e Saneamento",
        "7. Energia Limpa e Acessível",
        "8. Trabalho Decente e Crescimento Econômico",
        "9. Indústria, Inovação e Infraestrutura",
        "10. Redução das Desigualdades",
        "11. Cidades e Comunidades Sustentáveis",
        "12. Consumo e Produção Responsáveis",
        "13. Ação Contra a Mudança Global do Clima",
        "14. Vida na Água",
        "15. Vida Terrestre",
        "16. Paz, Justiça e Instituições Eficazes",
        "17. Parcerias e Meios de Implementação",
        "",
        "Seu papel nesta etapa é ajudar o usuário a identificar:",
        "1. relevantSdgs — Quais ODS são relevantes para este projeto",
        "2. sdgJustification — Justificativa de como o projeto contribui para cada ODS selecionado",
        "",
        "Orientações:",
        "- Faça uma pergunta por vez, de forma acolhedora e em português.",
        "- Confirme o entendimento antes de avançar para o próximo campo.",
        "- Se a resposta for ambígua, peça esclarecimento.",
        "- Ajude o usuário a perceber conexões que talvez não sejam óbvias (ex: um projeto de agrofloresta pode contribuir para ODS 2, 13 e 15 simultaneamente).",
        "- Incentive justificativas concretas, não genéricas.",
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
        "- Quais dos 17 ODS este projeto contribui diretamente?",
        "- De que forma concreta o projeto impacta cada ODS selecionado?",
        "- Há ODS que você gostaria de atingir, mas ainda não sabe como? (Podemos explorar juntos)",
      ].join("\n"),
    };

    return [systemMessage, userContextMessage];
  },

  isComplete(responses: StageResponses): boolean {
    return this.requiredFields.every((field) => responses[field] != null);
  },
};
