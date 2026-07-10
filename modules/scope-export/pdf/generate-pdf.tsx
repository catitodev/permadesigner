/**
 * PDF generation using @react-pdf/renderer.
 *
 * Renders a DesignScopeDocument into a PDF buffer using the PermaBrasilis
 * visual identity (colors, typography from tokens.ts).
 */

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { DesignScopeDocument } from "@/modules/core/documents";
import { colors, fonts, spacing } from "../templates/tokens";

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    fontFamily: fonts.body,
    fontSize: 10,
    paddingTop: spacing.pageMargin,
    paddingBottom: spacing.pageMargin,
    paddingHorizontal: spacing.pageMargin,
    color: colors.text,
  },
  header: {
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    paddingBottom: 12,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 22,
    color: colors.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    color: colors.textLight,
  },
  badge: {
    fontSize: 9,
    color: colors.background,
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  sectionTitle: {
    fontFamily: fonts.heading,
    fontSize: 14,
    color: colors.primary,
    marginTop: spacing.sectionGap,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 4,
  },
  field: {
    marginBottom: spacing.paragraphGap,
  },
  fieldLabel: {
    fontFamily: fonts.heading,
    fontSize: 9,
    color: colors.textLight,
    marginBottom: 2,
    textTransform: "uppercase",
  },
  fieldValue: {
    fontSize: 10,
    lineHeight: 1.5,
  },
  missingSection: {
    fontSize: 9,
    color: colors.terra,
    fontStyle: "italic",
    marginTop: 4,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: spacing.pageMargin,
    right: spacing.pageMargin,
    textAlign: "center",
    fontSize: 8,
    color: colors.textLight,
  },
});

// ─── Components ───────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Field({ label, value }: { label: string; value: string | undefined }) {
  if (!value) return null;
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

// ─── Document ─────────────────────────────────────────────────────────────────

function ScopeDocumentPDF({ doc }: { doc: DesignScopeDocument }) {
  const statusLabel =
    doc.status === "complete" ? "Planejamento Completo" : "Planejamento Inicial";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{doc.projectName}</Text>
          <Text style={styles.subtitle}>
            Documento de Escopo de Design em Permacultura
          </Text>
          <Text style={styles.badge}>{statusLabel}</Text>
        </View>

        {/* Goals */}
        {doc.sections.goals && (
          <Section title="1. Objetivos e Sonho do Projeto">
            <Field label="Visão" value={doc.sections.goals.projectVision} />
            <Field label="Objetivos" value={doc.sections.goals.mainGoals} />
            <Field label="Horizonte de tempo" value={doc.sections.goals.timeframe} />
          </Section>
        )}

        {/* Site Survey */}
        {doc.sections.siteSurvey && (
          <Section title="2. Levantamento do Local">
            <Field label="Localização" value={doc.sections.siteSurvey.location} />
            <Field label="Área" value={doc.sections.siteSurvey.area} />
            <Field label="Clima" value={doc.sections.siteSurvey.climate} />
            <Field label="Elementos existentes" value={doc.sections.siteSurvey.existingFeatures} />
          </Section>
        )}

        {/* Nature Patterns */}
        {doc.sections.naturePatterns.length > 0 && (
          <Section title="3. Leitura dos Padrões da Natureza">
            {doc.sections.naturePatterns.map((obs, i) => (
              <Field key={i} label={obs.category} value={obs.observation} />
            ))}
          </Section>
        )}

        {/* Boundaries & Resources */}
        {doc.sections.boundariesResources && (
          <Section title="4. Fronteiras e Recursos">
            <Field label="Fronteiras" value={doc.sections.boundariesResources.boundaries} />
            <Field label="Recursos" value={doc.sections.boundariesResources.resources} />
            <Field label="Restrições" value={doc.sections.boundariesResources.constraints} />
            <Field label="Orçamento" value={doc.sections.boundariesResources.budget} />
          </Section>
        )}

        {/* Design Decisions */}
        {doc.sections.designDecisions.length > 0 && (
          <Section title="5. Decisões de Design">
            {doc.sections.designDecisions.map((d, i) => (
              <Field key={i} label={d.principleId ? `Princípio ${d.principleId}` : "Decisão"} value={d.decision} />
            ))}
          </Section>
        )}

        {/* SDG Alignment */}
        {doc.sections.sdgAlignment.length > 0 && (
          <Section title="6. Alinhamento com os ODS">
            {doc.sections.sdgAlignment.map((s, i) => (
              <Field key={i} label={`ODS ${s.sdgId}`} value={s.justification} />
            ))}
          </Section>
        )}

        {/* Missing sections notice */}
        {doc.sections.missingSections && doc.sections.missingSections.length > 0 && (
          <View style={{ marginTop: 20 }}>
            <Text style={styles.missingSection}>
              ⚠ Seções pendentes: {doc.sections.missingSections.join(", ")}
            </Text>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          Gerado por PermaDesigner • {new Date(doc.generatedAt).toLocaleDateString("pt-BR")} • Versão {doc.version}
        </Text>
      </Page>
    </Document>
  );
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Renders the DesignScopeDocument as a PDF and returns the buffer.
 */
export async function generatePdfBuffer(
  doc: DesignScopeDocument,
): Promise<Buffer> {
  const buffer = await renderToBuffer(
    <ScopeDocumentPDF doc={doc} />,
  );
  return Buffer.from(buffer);
}
