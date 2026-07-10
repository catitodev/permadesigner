/**
 * Structured Form Fallback.
 *
 * When all AI providers are unavailable, the wizard continues functioning
 * by presenting static, pre-written questions as a structured form.
 * This satisfies Requirement 8.2: "the wizard continues functioning in form mode."
 *
 * Each wizard stage has a set of fallback questions mapped to its required fields.
 */

export interface FallbackQuestion {
  fieldKey: string;
  label: string;
  placeholder: string;
  inputType: "text" | "textarea" | "select";
  options?: string[];
  required: boolean;
}

/**
 * Static fallback questions for each wizard stage, keyed by stage ID.
 */
const fallbackQuestionsByStage: Record<string, FallbackQuestion[]> = {
  goals: [
    {
      fieldKey: "projectVision",
      label: "Qual é o sonho ou visão geral do seu projeto?",
      placeholder:
        "Descreva como você imagina este lugar no futuro — o que você gostaria de ver acontecendo aqui?",
      inputType: "textarea",
      required: true,
    },
    {
      fieldKey: "mainGoals",
      label: "Quais são os objetivos principais do projeto?",
      placeholder:
        "Ex.: produzir alimentos para a família, regenerar o solo, criar um espaço educativo...",
      inputType: "textarea",
      required: true,
    },
    {
      fieldKey: "timeframe",
      label: "Em quanto tempo você espera ver os primeiros resultados?",
      placeholder: "Ex.: 6 meses, 1 ano, 3 anos...",
      inputType: "text",
      required: true,
    },
  ],

  "site-survey": [
    {
      fieldKey: "location",
      label: "Onde fica o terreno do projeto?",
      placeholder: "Ex.: Zona rural de Botucatu, SP — sítio de 2 hectares",
      inputType: "text",
      required: true,
    },
    {
      fieldKey: "area",
      label: "Qual é a área aproximada do terreno?",
      placeholder: "Ex.: 5.000 m², 2 hectares, 1 alqueire...",
      inputType: "text",
      required: true,
    },
    {
      fieldKey: "climate",
      label: "Quais são as características climáticas do local?",
      placeholder:
        "Descreva: clima predominante, regime de chuvas, temperaturas médias, estação seca...",
      inputType: "textarea",
      required: true,
    },
    {
      fieldKey: "existingFeatures",
      label: "O que já existe no terreno?",
      placeholder:
        "Descreva construções, árvores, cursos d'água, estradas, cercas, infraestrutura existente...",
      inputType: "textarea",
      required: true,
    },
  ],

  "nature-patterns": [
    {
      fieldKey: "sunShade",
      label: "Padrões de sol e sombra",
      placeholder:
        "Em que direção o sol nasce e se põe? Quais áreas recebem mais sol? Há sombras de árvores ou construções?",
      inputType: "textarea",
      required: true,
    },
    {
      fieldKey: "water",
      label: "Padrões de água",
      placeholder:
        "Onde a água se acumula quando chove? Há nascentes, riachos ou áreas alagadas? Para onde a água escorre?",
      inputType: "textarea",
      required: true,
    },
    {
      fieldKey: "wind",
      label: "Padrões de vento",
      placeholder:
        "De que direção vem o vento predominante? Há ventos fortes em alguma estação? Quais áreas são protegidas?",
      inputType: "textarea",
      required: true,
    },
    {
      fieldKey: "topography",
      label: "Topografia",
      placeholder:
        "O terreno é plano, inclinado, ondulado? Qual é a orientação das encostas? Há diferenças de nível?",
      inputType: "textarea",
      required: true,
    },
    {
      fieldKey: "soil",
      label: "Características do solo",
      placeholder:
        "Cor, textura (arenoso, argiloso, misto), presença de matéria orgânica, compactação...",
      inputType: "textarea",
      required: true,
    },
    {
      fieldKey: "vegetation",
      label: "Vegetação existente",
      placeholder:
        "Que plantas já existem? Há árvores nativas, frutíferas, pastagem, mata ciliar?",
      inputType: "textarea",
      required: true,
    },
    {
      fieldKey: "wildlife",
      label: "Fauna observada",
      placeholder:
        "Que animais você já viu ou sabe que existem? Pássaros, insetos, mamíferos, répteis...",
      inputType: "textarea",
      required: false,
    },
    {
      fieldKey: "edges",
      label: "Bordas e ecótonos",
      placeholder:
        "Onde diferentes ambientes se encontram? (ex.: mata/pasto, água/terra, sol/sombra)",
      inputType: "textarea",
      required: false,
    },
    {
      fieldKey: "humanUse",
      label: "Uso humano atual",
      placeholder:
        "Como o terreno é usado hoje? Há caminhos, áreas de trabalho, zonas de convivência?",
      inputType: "textarea",
      required: false,
    },
  ],

  "boundaries-resources": [
    {
      fieldKey: "boundaries",
      label: "Quais são as fronteiras e limites do projeto?",
      placeholder:
        "Limites físicos (cercas, rios, estradas), regulatórios (zoneamento, APP), sociais (vizinhos, comunidade)...",
      inputType: "textarea",
      required: true,
    },
    {
      fieldKey: "availableResources",
      label: "Que recursos estão disponíveis?",
      placeholder:
        "Mão de obra, ferramentas, materiais locais, orçamento, conhecimento da equipe...",
      inputType: "textarea",
      required: true,
    },
    {
      fieldKey: "constraints",
      label: "Quais são as principais restrições ou desafios?",
      placeholder:
        "Orçamento limitado, falta de água, solo degradado, distância, regulamentação...",
      inputType: "textarea",
      required: true,
    },
  ],

  "design-decisions": [
    {
      fieldKey: "principleApplications",
      label: "Como os princípios da permacultura se aplicam ao seu projeto?",
      placeholder:
        "Descreva como você imagina aplicar pelo menos alguns dos 12 princípios no seu design...",
      inputType: "textarea",
      required: true,
    },
    {
      fieldKey: "frameworkChoice",
      label: "Qual framework de design você gostaria de usar como guia?",
      placeholder: "Escolha o framework que melhor se encaixa no seu contexto",
      inputType: "select",
      options: [
        "SADIMET — Survey, Analysis, Design, Implementation, Maintenance, Evaluation, Tweaking",
        "OBREDIMET — Observar, Bordas, Recursos, Estratégia, Design, Implementação, Manutenção, Evolução, Tweaking",
        "GoSADIM — Goal, Survey, Analysis, Design, Implementation, Maintenance",
        "Dragon Dreaming — Sonho, Planejamento, Ação, Celebração",
        "Outro / Não tenho certeza",
      ],
      required: true,
    },
    {
      fieldKey: "designStrategies",
      label: "Quais estratégias de design você está considerando?",
      placeholder:
        "Ex.: zonas e setores, sistemas agroflorestais, captação de água, bioconstrução...",
      inputType: "textarea",
      required: true,
    },
  ],

  "sdg-alignment": [
    {
      fieldKey: "relevantSdgs",
      label:
        "Quais Objetivos de Desenvolvimento Sustentável (ODS) seu projeto endereça?",
      placeholder: "Selecione os ODS mais relevantes para o seu projeto",
      inputType: "select",
      options: [
        "ODS 2 — Fome Zero e Agricultura Sustentável",
        "ODS 6 — Água Potável e Saneamento",
        "ODS 7 — Energia Limpa e Acessível",
        "ODS 11 — Cidades e Comunidades Sustentáveis",
        "ODS 12 — Consumo e Produção Responsáveis",
        "ODS 13 — Ação Contra a Mudança Global do Clima",
        "ODS 15 — Vida Terrestre",
      ],
      required: true,
    },
    {
      fieldKey: "sdgJustification",
      label: "Como seu projeto contribui para esses ODS?",
      placeholder:
        "Descreva brevemente de que forma as ações planejadas contribuem para cada ODS selecionado...",
      inputType: "textarea",
      required: true,
    },
  ],
};

/**
 * Returns the fallback form questions for a given wizard stage.
 *
 * When all AI providers fail, the conversation wizard uses these static
 * questions to let the user continue filling project data without AI assistance.
 *
 * @param stageId - The wizard stage identifier (e.g., "goals", "site-survey")
 * @returns Array of fallback questions for the stage, or empty array if stage is unknown
 */
export function getFallbackQuestions(stageId: string): FallbackQuestion[] {
  return fallbackQuestionsByStage[stageId] ?? [];
}

/**
 * Returns all stage IDs that have fallback questions defined.
 * Useful for checking fallback coverage.
 */
export function getFallbackStageIds(): string[] {
  return Object.keys(fallbackQuestionsByStage);
}
