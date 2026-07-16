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
 * Dashboard — home page after login.
 * Shows mode explainer + project list.
 */
export default async function DashboardPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, completeness_status, updated_at, current_stage_id, navigation_mode")
    .eq("user_id", user!.id)
    .order("updated_at", { ascending: false });

  return (
    <div className="mx-auto w-full max-w-4xl overflow-auto px-4 py-8">
      {/* Mode explainer cards */}
      <div className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">Modos de navegação</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-perma-green/30 bg-perma-green/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🎓</span>
              <span className="font-bold text-perma-green">Estudante</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Tutor empático que explica conceitos, sugere princípios relevantes e nunca julga o que você não sabe.
            </p>
          </div>
          <div className="rounded-xl border border-perma-teal/30 bg-perma-teal/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🛠️</span>
              <span className="font-bold text-perma-teal">Designer</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Equipe multidisciplinar que sugere competências humanas e ferramentas open-source para cada decisão.
            </p>
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Você escolhe o modo ao abrir cada projeto — pode trocar a qualquer momento.</p>
      </div>

      {/* Projects header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Meus Projetos</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie seus projetos de design em permacultura
          </p>
        </div>
        <NewProjectDialog />
      </div>

      {/* Project list */}
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
              <Card className="h-full border-perma-green/10 transition-shadow group-hover:ring-2 group-hover:ring-perma-green/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{project.name}</CardTitle>
                    <span className="text-xs">
                      {project.navigation_mode === "designer" ? "🛠️" : "🎓"}
                    </span>
                  </div>
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
                    <CompletenessIndicator status={project.completeness_status} />
                    <span className="text-xs text-muted-foreground">
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
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-perma-green/30 p-12 text-center">
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

function CompletenessIndicator({ status }: { status: string | null }) {
  let completedCount = 0;
  const totalStages = 6;
  try {
    if (status) {
      const parsed = typeof status === "string" ? JSON.parse(status) : status;
      completedCount = Object.values(parsed).filter(Boolean).length;
    }
  } catch { /* */ }
  const percentage = Math.round((completedCount / totalStages) * 100);

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        percentage === 100
          ? "bg-perma-green/10 text-perma-green"
          : percentage > 0
            ? "bg-perma-gold/10 text-perma-gold"
            : "bg-muted text-muted-foreground"
      }`}
    >
      {percentage}% completo
    </span>
  );
}

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
