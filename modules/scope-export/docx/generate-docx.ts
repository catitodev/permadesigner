/**
 * DOCX generation using the `docx` library.
 *
 * Renders a DesignScopeDocument into a .docx buffer.
 * Uses the same DesignScopeDocument as the PDF generator — no divergence.
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  BorderStyle,
  AlignmentType,
} from "docx";
import type { DesignScopeDocument } from "@/modules/core/documents";
import { colors } from "../templates/tokens";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function heading(text: string, level: (typeof HeadingLevel)[keyof typeof HeadingLevel] = HeadingLevel.HEADING_2) {
  return new Paragraph({
    heading: level,
    spacing: { before: 300, after: 100 },
    children: [
      new TextRun({ text, bold: true, color: colors.primary.replace("#", "") }),
    ],
  });
}

function field(label: string, value: string | undefined) {
  if (!value) return [];
  return [
    new Paragraph({
      spacing: { before: 120, after: 40 },
      children: [
        new TextRun({ text: `${label}: `, bold: true, size: 20, color: "4a4a4a" }),
        new TextRun({ text: value, size: 20 }),
      ],
    }),
  ];
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generates a DOCX buffer from the DesignScopeDocument.
 */
export async function generateDocxBuffer(doc: DesignScopeDocument): Promise<Buffer> {
  const statusLabel =
    doc.status === "complete" ? "Planejamento Completo" : "Planejamento Inicial";

  const sections: Paragraph[] = [];

  // Title
  sections.push(
    new Paragraph({
      heading: HeadingLevel.TITLE,
      spacing: { after: 100 },
      children: [
        new TextRun({ text: doc.projectName, bold: true, size: 44, color: colors.primary.replace("#", "") }),
      ],
    }),
  );

  // Subtitle
  sections.push(
    new Paragraph({
      spacing: { after: 60 },
      children: [
        new TextRun({ text: "Documento de Escopo de Design em Permacultura", size: 22, italics: true, color: "4a4a4a" }),
      ],
    }),
  );

  // Status badge
  sections.push(
    new Paragraph({
      spacing: { after: 200 },
      children: [
        new TextRun({ text: `[${statusLabel}]`, bold: true, size: 20, color: colors.primary.replace("#", "") }),
        new TextRun({ text: `  •  Versão ${doc.version}  •  ${new Date(doc.generatedAt).toLocaleDateString("pt-BR")}`, size: 18, color: "4a4a4a" }),
      ],
    }),
  );

  // Separator
  sections.push(
    new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: colors.primary.replace("#", "") } },
      spacing: { after: 200 },
      children: [],
    }),
  );

  // 1. Goals
  if (doc.sections.goals) {
    sections.push(heading("1. Objetivos e Sonho do Projeto"));
    sections.push(...field("Visão", doc.sections.goals.projectVision));
    sections.push(...field("Objetivos", doc.sections.goals.mainGoals));
    sections.push(...field("Horizonte de tempo", doc.sections.goals.timeframe));
  }

  // 2. Site Survey
  if (doc.sections.siteSurvey) {
    sections.push(heading("2. Levantamento do Local"));
    sections.push(...field("Localização", doc.sections.siteSurvey.location));
    sections.push(...field("Área", doc.sections.siteSurvey.area));
    sections.push(...field("Clima", doc.sections.siteSurvey.climate));
    sections.push(...field("Elementos existentes", doc.sections.siteSurvey.existingFeatures));
  }

  // 3. Nature Patterns
  if (doc.sections.naturePatterns.length > 0) {
    sections.push(heading("3. Leitura dos Padrões da Natureza"));
    for (const obs of doc.sections.naturePatterns) {
      sections.push(...field(obs.category, obs.observation));
    }
  }

  // 4. Boundaries & Resources
  if (doc.sections.boundariesResources) {
    sections.push(heading("4. Fronteiras e Recursos"));
    sections.push(...field("Fronteiras", doc.sections.boundariesResources.boundaries));
    sections.push(...field("Recursos", doc.sections.boundariesResources.resources));
    sections.push(...field("Restrições", doc.sections.boundariesResources.constraints));
    sections.push(...field("Orçamento", doc.sections.boundariesResources.budget));
  }

  // 5. Design Decisions
  if (doc.sections.designDecisions.length > 0) {
    sections.push(heading("5. Decisões de Design"));
    for (const d of doc.sections.designDecisions) {
      const label = d.principleId ? `Princípio ${d.principleId}` : "Decisão";
      sections.push(...field(label, d.decision));
    }
  }

  // 6. SDG Alignment
  if (doc.sections.sdgAlignment.length > 0) {
    sections.push(heading("6. Alinhamento com os ODS"));
    for (const s of doc.sections.sdgAlignment) {
      sections.push(...field(`ODS ${s.sdgId}`, s.justification));
    }
  }

  // Missing sections warning
  if (doc.sections.missingSections && doc.sections.missingSections.length > 0) {
    sections.push(
      new Paragraph({
        spacing: { before: 300 },
        children: [
          new TextRun({
            text: `⚠ Seções pendentes: ${doc.sections.missingSections.join(", ")}`,
            italics: true,
            size: 18,
            color: "c2552a",
          }),
        ],
      }),
    );
  }

  // Footer
  sections.push(
    new Paragraph({
      spacing: { before: 400 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `Gerado por PermaDesigner • ${new Date(doc.generatedAt).toLocaleDateString("pt-BR")} • Versão ${doc.version}`,
          size: 16,
          color: "4a4a4a",
        }),
      ],
    }),
  );

  const docx = new Document({
    sections: [{ children: sections }],
  });

  const buffer = await Packer.toBuffer(docx);
  return Buffer.from(buffer);
}
