import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { buildScopeDocument } from "@/modules/core/documents";
import type { StageResponses } from "@/modules/core/documents";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeftIcon } from "lucide-react";
import { ExportActions } from "./export-actions";

interface ScopePageProps {
  params: Promise<{ id: string }>;
}

/**
 * Scope document preview page.
 * Shows the assembled document with download (PDF/DOCX) and email buttons.
 * Requirements: 6.1, 6.2, 6.3
 */
export default async function ScopePage({ params }: ScopePageProps) {
  const { id } = await params;
  const supabase = await createServerClient();

  // Fetch project
  const { data: project, error } = await supabase
    .from("projects")
    .select("id, name")
    .eq("id", id)
    .single();

  if (error || !project) {
    notFound();
  }

  // Load stage responses
  const { data: responseRows } = await supabase
    .from("stage_responses")
    .select("stage_id, field_key, value")
    .eq("project_id", id);

  const allResponses: Record<string, StageResponses> = {};
  for (const row of responseRows ?? []) {
    if (!allResponses[row.stage_id]) {
      allResponses[row.stage_id] = {};
    }
    allResponses[row.stage_id][row.field_key] = row.value;
  }

  const doc = buildScopeDocument(id, project.name, allResponses);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/projects/${id}`}>
            <Button variant="ghost" size="icon" aria-label="Voltar ao projeto">
              <ArrowLeftIcon className="size-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold">{project.name}</h1>
            <p className="text-sm text-muted-foreground">Documento de Escopo</p>
          </div>
        </div>

        {/* Status badge */}
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            doc.status === "complete"
              ? "bg-perma-green/10 text-perma-green"
              : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
          }`}
        >
          {doc.status === "complete" ? "Planejamento Completo" : "Planejamento Inicial"}
        </span>
      </div>

      {/* Export actions */}
      <ExportActions projectId={id} />

      {/* Missing sections warning */}
      {doc.sections.missingSections && doc.sections.missingSections.length > 0 && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
          <p className="font-medium">⚠ Seções pendentes</p>
          <p className="mt-1">
            Complete as seguintes etapas para gerar um planejamento completo:{" "}
            {doc.sections.missingSections.join(", ")}
          </p>
        </div>
      )}

      {/* Document preview */}
      <div className="space-y-4">
        {/* Goals */}
        {doc.sections.goals && (
          <SectionCard title="1. Objetivos e Sonho do Projeto">
            <FieldRow label="Visão" value={doc.sections.goals.projectVision} />
            <FieldRow label="Objetivos" value={doc.sections.goals.mainGoals} />
            <FieldRow label="Horizonte" value={doc.sections.goals.timeframe} />
          </SectionCard>
        )}

        {/* Site Survey */}
        {doc.sections.siteSurvey && (
          <SectionCard title="2. Levantamento do Local">
            <FieldRow label="Localização" value={doc.sections.siteSurvey.location} />
            <FieldRow label="Área" value={doc.sections.siteSurvey.area} />
            <FieldRow label="Clima" value={doc.sections.siteSurvey.climate} />
            <FieldRow label="Elementos existentes" value={doc.sections.siteSurvey.existingFeatures} />
          </SectionCard>
        )}

        {/* Nature Patterns */}
        {doc.sections.naturePatterns.length > 0 && (
          <SectionCard title="3. Leitura dos Padrões da Natureza">
            {doc.sections.naturePatterns.map((obs, i) => (
              <FieldRow key={i} label={obs.category} value={obs.observation} />
            ))}
          </SectionCard>
        )}

        {/* Boundaries & Resources */}
        {doc.sections.boundariesResources && (
          <SectionCard title="4. Fronteiras e Recursos">
            <FieldRow label="Fronteiras" value={doc.sections.boundariesResources.boundaries} />
            <FieldRow label="Recursos" value={doc.sections.boundariesResources.resources} />
            <FieldRow label="Restrições" value={doc.sections.boundariesResources.constraints} />
            <FieldRow label="Orçamento" value={doc.sections.boundariesResources.budget} />
          </SectionCard>
        )}

        {/* Design Decisions */}
        {doc.sections.designDecisions.length > 0 && (
          <SectionCard title="5. Decisões de Design">
            {doc.sections.designDecisions.map((d, i) => (
              <FieldRow key={i} label={d.principleId ? `Princípio ${d.principleId}` : "Decisão"} value={d.decision} />
            ))}
          </SectionCard>
        )}

        {/* SDG Alignment */}
        {doc.sections.sdgAlignment.length > 0 && (
          <SectionCard title="6. Alinhamento com os ODS">
            {doc.sections.sdgAlignment.map((s, i) => (
              <FieldRow key={i} label={`ODS ${s.sdgId}`} value={s.justification} />
            ))}
          </SectionCard>
        )}

        {/* Empty state */}
        {!doc.sections.goals && !doc.sections.siteSurvey && doc.sections.naturePatterns.length === 0 && (
          <div className="rounded-xl border border-dashed p-12 text-center">
            <p className="text-muted-foreground">
              Nenhuma informação coletada ainda. Volte ao chat e responda as perguntas do assistente para preencher o documento.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-perma-green">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">{children}</CardContent>
    </Card>
  );
}

function FieldRow({ label, value }: { label: string; value: string | undefined }) {
  if (!value) return null;
  return (
    <div className="text-sm">
      <span className="font-medium text-muted-foreground">{label}: </span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}
