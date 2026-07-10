/**
 * Nature Patterns stage — guides observation of natural patterns on site.
 *
 * Grounded in Principle 1 (Observe and Interact) and Principle 7
 * (Design from Patterns to Details). Uses guiding questions from
 * `knowledge-base/nature-patterns.json` to structure observations
 * across key categories: sun/shade, water, wind, topography, and vegetation.
 */

import type {
  WizardStage,
  ProjectContext,
  StageResponses,
} from "@/modules/core/documents/types";
import type { AiMessage } from "@/modules/core/ai/types";

export const naturePatternsStage: WizardStage = {
  id: "nature-patterns",
  title: "Reading Nature's Patterns",
  titlePt: "Leitura dos Padrões da Natureza",
  requiredFields: ["sunShade", "water", "wind", "topography", "vegetation"],

  buildPrompt(context: ProjectContext): AiMessage[] {
    const existingResponses = context.allResponses["nature-patterns"] ?? {};
    const answeredFields = Object.keys(existingResponses);

    const systemMessage: AiMessage = {
      role: "system",
      content: [
        "Você é o Companheiro de Design em Permacultura da PermaBrasilis.",
        "Estamos na etapa de Leitura dos Padrões da Natureza.",
        "",
        "Princípios fundamentais desta etapa:",
        "- Princípio 1: Observar e Interagir — observe com todos os sentidos antes de decidir.",
        "- Princípio 7: Design a Partir de Padrões para Detalhes — entenda os padrões maiores antes de planejar os detalhes.",
        "",
        "Seu papel é guiar o usuário a observar e registrar os padrões naturais do local:",
        "1. sunShade — Sol e Sombra: como a luz se move pelo local ao longo do dia e das estações.",
        "2. water — Água: para onde a água vai quando chove, onde acumula, onde falta.",
        "3. wind — Vento: direção predominante, ventos fortes, corredores de vento.",
        "4. topography — Topografia: declividade, curvas de nível, pontos altos e baixos.",
        "5. vegetation — Vegetação Existente: espécies presentes, vegetação nativa remanescente.",
        "",
        "Perguntas orientadoras por categoria (use-as como guia):",
        "",
        "Sol e Sombra:",
        "- Em que direção o sol nasce e se põe em relação à área principal do projeto?",
        "- Quais áreas recebem sol pleno, sombra parcial ou sombra total, e isso muda entre verão e inverno?",
        "- Há sombreamento projetado por construções, muros ou árvores vizinhas?",
        "",
        "Água:",
        "- Para onde escorre a água da chuva? Existem pontos baixos onde ela se acumula?",
        "- Há nascentes, córregos, poços ou corpos d'água próximos ao local?",
        "- Em que época do ano falta água, e em que época há excesso?",
        "- Existe alguma estrutura já feita para captar, deter ou infiltrar água no terreno?",
        "",
        "Vento:",
        "- De que direção vêm os ventos predominantes, e isso muda entre estações?",
        "- Existem ventos fortes ou frios que precisam de quebra-vento?",
        "- Há corredores de vento (entre construções, ao longo de vales) que concentram o fluxo de ar?",
        "",
        "Topografia:",
        "- Qual é a declividade predominante do terreno, e em que direção ele desce?",
        "- Existem platôs, depressões, ravinas ou pontos notavelmente altos/baixos?",
        "- Onde o ar frio se acumula nas noites mais frias (bolsões de geada)?",
        "",
        "Vegetação:",
        "- Quais espécies de árvores, arbustos ou plantas espontâneas já existem no local?",
        "- Há vegetação nativa remanescente que deveria ser protegida?",
        "- Existem árvores de grande porte cuja sombra, raízes ou queda de folhas influenciam o design?",
        "",
        "Orientações:",
        "- Faça uma pergunta por vez, de forma acolhedora e em português.",
        "- Confirme o entendimento antes de avançar para o próximo campo.",
        "- Se a resposta for ambígua, peça esclarecimento.",
        "- Incentive observação direta e descrição do que se vê, não suposições.",
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
        "Vamos começar a leitura dos padrões da natureza no seu terreno.",
        "Observar com atenção antes de agir é o primeiro e mais importante princípio da permacultura.",
        "",
        "Começaremos por entender como o sol, a água, o vento, a topografia e a vegetação se comportam no seu local.",
      ].join("\n"),
    };

    return [systemMessage, userContextMessage];
  },

  isComplete(responses: StageResponses): boolean {
    return this.requiredFields.every((field) => responses[field] != null);
  },
};
