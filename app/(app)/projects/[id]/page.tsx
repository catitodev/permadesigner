import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import { DEFAULT_STAGES } from "@/modules/conversation-wizard";
import { ChatInterface } from "@/modules/conversation-wizard/components/chat-interface";
import { ModeSelector } from "@/modules/conversation-wizard/components/mode-selector";
import type { ChatMessageData } from "@/modules/conversation-wizard/components/chat-message";
import type { StageInfo } from "@/modules/conversation-wizard/components/stage-navigation";
import type { GroundingRef } from "@/modules/conversation-wizard/components/grounding-badge";

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Project detail page — restores state (current stage, conversation history)
 * and renders the full chat interface.
 *
 * Requirements: 3.3, 4.2, 7.3, 11.1
 */
export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params;
  const supabase = await createServerClient();

  // Fetch project (RLS ensures only owner can access)
  const { data: project, error } = await supabase
    .from("projects")
    .select("id, name, current_stage_id, completeness_status, updated_at")
    .eq("id", id)
    .single();

  if (error || !project) {
    notFound();
  }

  // Fetch navigation_mode separately (column may not exist if migration not run)
  const { data: modeData } = await supabase
    .from("projects")
    .select("navigation_mode")
    .eq("id", id)
    .single();

  const navigationMode = (modeData?.navigation_mode as "student" | "designer") ?? "student";

  // Restore conversation history for the project
  const { data: rawMessages } = await supabase
    .from("conversation_messages")
    .select("id, role, content, stage_id, grounding_refs, created_at")
    .eq("project_id", id)
    .order("created_at", { ascending: true });

  // Fetch stage responses to determine completion status
  const { data: stageResponses } = await supabase
    .from("stage_responses")
    .select("stage_id, field_key, value")
    .eq("project_id", id);

  // Build messages for the chat component
  const messages: ChatMessageData[] = (rawMessages ?? []).map((msg) => ({
    id: msg.id,
    role: msg.role as "user" | "assistant",
    content: msg.content,
    groundingRefs: (msg.grounding_refs as GroundingRef[]) ?? undefined,
    createdAt: msg.created_at,
  }));

  // Build stage info for the navigation bar
  const responsesByStage: Record<string, Set<string>> = {};
  for (const resp of stageResponses ?? []) {
    if (!responsesByStage[resp.stage_id]) {
      responsesByStage[resp.stage_id] = new Set();
    }
    responsesByStage[resp.stage_id].add(resp.field_key);
  }

  const stages: StageInfo[] = DEFAULT_STAGES.map((stage) => {
    const filledFields = responsesByStage[stage.id] ?? new Set();
    const isComplete = stage.requiredFields.every((f) => filledFields.has(f));
    return {
      id: stage.id,
      titlePt: stage.titlePt,
      isComplete,
    };
  });

  const currentStageId = project.current_stage_id ?? DEFAULT_STAGES[0].id;

  return (
    <div className="flex h-full flex-col overflow-hidden px-2 py-2 sm:px-4 sm:py-3">
      {/* Header */}
      <div className="mb-2 flex shrink-0 items-center gap-3">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" aria-label="Voltar ao painel">
            <ArrowLeftIcon className="size-4" />
          </Button>
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold tracking-tight sm:text-xl">
            {project.name}
          </h1>
        </div>
        <ModeSelector projectId={id} currentMode={navigationMode} />
      </div>

      {/* Chat interface takes remaining height */}
      <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-border bg-card">
        <ChatInterface
          projectId={id}
          projectName={project.name}
          initialMessages={messages}
          stages={stages}
          currentStageId={currentStageId}
        />
      </div>
    </div>
  );
}
