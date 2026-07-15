/**
 * Converts frameworks.json to multilingual format.
 * Run: npx tsx scripts/convert-frameworks-i18n.ts
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const FILE = join(process.cwd(), "knowledge-base", "frameworks.json");
const data = JSON.parse(readFileSync(FILE, "utf-8"));

// Translation map: pt-BR → en, es for the 8 frameworks
const translations: Record<string, { en: Record<string, string>; es: Record<string, string> }> = {
  sadimet: {
    en: {
      subtitle: "The classic circular permaculture framework",
      description: "The most widely taught design framework in Permaculture Design Courses (PDCs) worldwide. Evolved from SADI (Survey, Analysis, Design, Implementation), from landscape architecture, adding maintenance, evaluation, and tweaking.",
      special: "It's circular, not linear: after Tweaking, the process returns to Survey. It reflects a central truth of permaculture — living systems have no end.",
    },
    es: {
      subtitle: "El clásico circular de la permacultura",
      description: "El framework de diseño más enseñado en cursos de Permacultura (PDCs) alrededor del mundo. Evoluciona del SADI (Survey, Analysis, Design, Implementation), de la arquitectura paisajística, agregando mantenimiento, evaluación y ajuste.",
      special: "Es circular, no lineal: después del Tweaking, el proceso retorna al Survey. Refleja una verdad central de la permacultura — los sistemas vivos no tienen fin.",
    },
  },
  obredimet: {
    en: {
      subtitle: "The evolution of the classic",
      description: "Evolution of SADIMET that deepens the initial stages, expanding 'Survey' into comprehensive observation and splitting analysis into Boundaries and Resources. Contributions from educators like Andrew Langford, of Gaia University.",
      special: "Boundaries start from the three ethics of permaculture — Earth Care, People Care, Fair Share — only then come climate, budget, legislation and other concrete limitations.",
    },
    es: {
      subtitle: "La evolución del clásico",
      description: "Evolución del SADIMET que profundiza las etapas iniciales, expandiendo el 'Survey' en observación integral y dividiendo el análisis en Fronteras y Recursos. Con contribuciones de educadores como Andrew Langford, de la Gaia University.",
      special: "Las fronteras parten de las tres éticas de la permacultura — Cuidado de la Tierra, Cuidado de las Personas, Reparto Justo — solo después vienen clima, presupuesto, legislación y otras limitaciones concretas.",
    },
  },
  design_web: {
    en: {
      subtitle: "Looby Macnamara's non-linear web",
      description: "Created by Looby Macnamara, author of People & Permaculture. Linear processes work well for land, but fail with people and cultures — the Design Web breaks with that linearity.",
      special: "12 anchor points in 4 phases (Growth, Exploration, Productivity, Reflection). You visit points in whatever order makes sense — a dance between designer, client, and design, not a fixed sequence.",
    },
    es: {
      subtitle: "La tela no lineal de Looby Macnamara",
      description: "Creado por Looby Macnamara, autora de People & Permaculture. Los procesos lineales funcionan bien para la tierra, pero fallan con personas y culturas — el Design Web rompe con esa linealidad.",
      special: "12 puntos de anclaje en 4 fases (Crecimiento, Exploración, Productividad, Reflexión). Visitas los puntos en el orden que tenga sentido — una danza entre diseñador, cliente y diseño, no una secuencia fija.",
    },
  },
  dragon_dreaming: {
    en: {
      subtitle: "The design of collective dreams",
      description: "Created by John Croft and Vivienne Elanta around 1990, at the Gaia Foundation (Western Australia). A life philosophy that starts from the collective dream, not from the technical plan.",
      special: "4 phases — Dreaming, Planning, Doing, Celebrating — with 16 stages total. The central concept is Win-Win-Win culture: each decision must benefit the person, the community, and the Earth.",
    },
    es: {
      subtitle: "El diseño de los sueños colectivos",
      description: "Creado por John Croft y Vivienne Elanta alrededor de 1990, en la Gaia Foundation (Australia Occidental). Una filosofía de vida que comienza por el sueño colectivo, no por el plan técnico.",
      special: "4 fases — Soñar, Planificar, Hacer, Celebrar — con 16 etapas en total. El concepto central es la cultura Win-Win-Win: cada decisión debe beneficiar a la persona, la comunidad y la Tierra.",
    },
  },
  theory_u: {
    en: {
      subtitle: "The consciousness that shapes the emerging future",
      description: "Developed by Otto Scharmer (MIT Sloan / Presencing Institute). Increasingly used by regenerative designers working on large-scale systemic change.",
      special: "U-shaped journey with 5 movements. At the bottom of the U is Presencing: the moment of letting go of the old ego and opening space for what wants to emerge.",
    },
    es: {
      subtitle: "La conciencia que moldea el futuro emergente",
      description: "Desarrollada por Otto Scharmer (MIT Sloan / Presencing Institute). Cada vez más usada por diseñadores regenerativos que trabajan cambio sistémico a gran escala.",
      special: "Viaje en forma de U con 5 movimientos. En el fondo de la U está el Presencing: el momento de soltar el ego antiguo y abrir espacio para lo que quiere emerger.",
    },
  },
  sadi_bredim: {
    en: {
      subtitle: "The historical roots",
      description: "Before SADIMET or OBREDIMET existed, two ancestral processes influenced permaculture: SADI (landscape architecture) and BREDIM (industrial engineering). Both are more linear.",
      special: "Mollison and Holmgren synthesized landscape architecture, engineering, ecology, and indigenous systems to create permaculture. SADI and BREDIM are that historical bridge.",
    },
    es: {
      subtitle: "Las raíces históricas",
      description: "Antes de que existieran SADIMET u OBREDIMET, dos procesos ancestrales influenciaron la permacultura: SADI (arquitectura paisajística) y BREDIM (ingeniería industrial). Ambos son más lineales.",
      special: "Mollison y Holmgren sintetizaron arquitectura paisajística, ingeniería, ecología y sistemas indígenas para crear la permacultura. SADI y BREDIM son ese puente histórico.",
    },
  },
  cultural_emergence: {
    en: {
      subtitle: "The cultural change toolkit",
      description: "Toolkit co-created by Looby Macnamara and Jon Young (8 Shields Institute) in 2016, uniting permaculture design with cultural and behavioral change.",
      special: "Includes the CEED Deck, a deck of empowerment and design cards. Starts from the premise that the greatest crisis we face is cultural, not technical.",
    },
    es: {
      subtitle: "El toolkit de cambio cultural",
      description: "Toolkit co-creado por Looby Macnamara y Jon Young (8 Shields Institute) en 2016, uniendo diseño de permacultura con cambio cultural y comportamental.",
      special: "Incluye el CEED Deck, un mazo de cartas de empoderamiento y diseño. Parte de la premisa de que la mayor crisis que enfrentamos es cultural, no técnica.",
    },
  },
  gosadim: {
    en: {
      subtitle: "The academic variant",
      description: "Variant of SADIMET developed at Gaia University, by educators like Graham Burnett (Spiral Seed) and Andrew Langford, adding Goals at the beginning of the process.",
      special: "'If you don't have a dream, how can you have a dream come true?' — Graham Burnett summarizes the spirit of the initial goal articulation stage.",
    },
    es: {
      subtitle: "La variante académica",
      description: "Variante del SADIMET desarrollada en la Gaia University, por educadores como Graham Burnett (Spiral Seed) y Andrew Langford, agregando Goals (Metas) al inicio del proceso.",
      special: "'Si no tienes un sueño, ¿cómo puedes tener un sueño realizado?' — Graham Burnett resume el espíritu de la etapa inicial de articulación de metas.",
    },
  },
};

// Convert frameworks
for (const fw of data) {
  const t = translations[fw.id];
  if (!t) continue;

  // Convert subtitle, description, special to locale objects
  fw.subtitle = { "pt-BR": fw.subtitle, en: t.en.subtitle, es: t.es.subtitle };
  fw.description = { "pt-BR": fw.description, en: t.en.description, es: t.es.description };
  fw.special = { "pt-BR": fw.special, en: t.en.special, es: t.es.special };
}

writeFileSync(FILE, JSON.stringify(data, null, 2), "utf-8");
console.log("✅ frameworks.json converted to multilingual format");
