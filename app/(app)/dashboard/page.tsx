import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { NewProjectDialog } from "./new-project-dialog";

/**
 * Dashboard page — lists all projects for the authenticated user.
 * Ordered by most recently updated. Shows completeness and last update.
 */
export default async function DashboardPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, completeness_status, updated_at, current_stage_id")
    .eq("user_id", user!.id)
    .order("updated_at", { ascending: false });

  return (
    <div className="mx-auto w-full max-w-4xl overflow-auto px-4 py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Meus Projetos</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie seus projetos de design em permacultura
          </p>
        </div>
        <NewProjectDialog />
      </div>

      {!projects || projects.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="group transition-transform hover:-translate-y-0.5"
            >
              <Card className="h-full transition-shadow group-hover:ring-2 group-hover:ring-primary/20">
                <CardHeader>
                  <CardTitle>{project.name}</CardTitle>
                  <CardDescription>
                    Atualizado em{" "}
                    {new Date(project.updated_at).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <CompletenessIndicator
                      status={project.completeness_status}
                    />
                    <span className="text-xs text-muted-foreground">
                      Etapa atual:{" "}
                      {formatStageName(project.current_stage_id)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center">
      <div className="mb-4 text-4xl">🌱</div>
      <h2 className="mb-2 text-lg font-semibold">Nenhum projeto ainda</h2>
      <p className="mb-6 max-w-sm text-sm text-muted-foreground">
        Comece criando seu primeiro projeto de permacultura. O assistente vai te
        guiar passo a passo pelo processo de design.
      </p>
      <NewProjectDialog />
    </div>
  );
}

/**
 * Displays a simple completeness badge based on the JSON status object.
 * The completeness_status field stores which stages are complete.
 */
function CompletenessIndicator({ status }: { status: string | null }) {
  let completedCount = 0;
  const totalStages = 6;

  try {
    if (status) {
      const parsed =
        typeof status === "string" ? JSON.parse(status) : status;
      completedCount = Object.values(parsed).filter(Boolean).length;
    }
  } catch {
    // If parsing fails, show 0%
  }

  const percentage = Math.round((completedCount / totalStages) * 100);

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        percentage === 100
          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
          : percentage > 0
            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
            : "bg-muted text-muted-foreground"
      }`}
    >
      {percentage}% completo
    </span>
  );
}

/**
 * Maps internal stage IDs to user-friendly Portuguese names.
 */
function formatStageName(stageId: string | null): string {
  const stageNames: Record<string, string> = {
    goals: "Objetivos",
    "site-survey": "Levantamento",
    "nature-patterns": "Padrões da Natureza",
    "boundaries-resources": "Fronteiras e Recursos",
    "design-decisions": "Decisões de Design",
    "sdg-alignment": "Alinhamento ODS",
  };

  return stageNames[stageId ?? ""] ?? "Início";
}
