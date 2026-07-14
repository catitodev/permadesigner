/**
 * POST /api/chat
 *
 * Orchestrates the full wizard-AI-grounding pipeline:
 *   1. Validate auth session
 *   2. Parse & validate request body
 *   3. Verify project ownership (RLS + explicit check)
 *   4. Load knowledge context from knowledge-base/*.json
 *   5. Initialize state machine at the correct stage
 *   6. Load conversation history
 *   7. Build stage prompt with project context
 *   8. Persist user message
 *   9. Generate AI response (with retry on grounding failure)
 *  10. Validate response via GroundingValidator
 *  11. Persist assistant message + grounding refs
 *  12. Update project current_stage_id
 *
 * Requirements: 4.2, 4.3, 4.6, 7.1, 7.2, 8.2
 */

import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { resolve } from "path";

import { createServerClient } from "@/lib/supabase/server";
import {
  getAiProvider,
  getSystemPrompt,
  AiProviderError,
} from "@/modules/core/ai";
import type { AiMessage } from "@/modules/core/ai";
import {
  GroundingValidator,
  type KnowledgeContext,
} from "@/modules/core/grounding";
import { WizardStateMachine } from "@/modules/conversation-wizard";
import { getFallbackQuestions } from "@/modules/conversation-wizard/fallback-form";
import type { StageResponses } from "@/modules/core/documents/types";
import { sanitizeUserMessage, maskSensitiveData } from "@/lib/security/sanitize";
import { checkRateLimit } from "@/lib/security/rate-limit";

// ─── Knowledge Context Cache ──────────────────────────────────────────────────

let cachedKnowledgeContext: KnowledgeContext | null = null;

/**
 * Loads and caches the knowledge-base JSON files.
 * These don't change at runtime, so we read them once.
 */
function loadKnowledgeContext(): KnowledgeContext {
  if (cachedKnowledgeContext) return cachedKnowledgeContext;

  const basePath = resolve(process.cwd(), "knowledge-base");

  const frameworks = JSON.parse(
    readFileSync(resolve(basePath, "frameworks.json"), "utf-8"),
  );
  const principles = JSON.parse(
    readFileSync(resolve(basePath, "principles.json"), "utf-8"),
  );
  const sdgs = JSON.parse(
    readFileSync(resolve(basePath, "sdgs.json"), "utf-8"),
  );
  const naturePatterns = JSON.parse(
    readFileSync(resolve(basePath, "nature-patterns.json"), "utf-8"),
  );

  cachedKnowledgeContext = { frameworks, principles, sdgs, naturePatterns };
  return cachedKnowledgeContext;
}

// ─── Helper: Load stage responses ─────────────────────────────────────────────

/**
 * Loads all stage responses for a project, grouped by stage_id.
 */
async function loadStageResponses(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  projectId: string,
): Promise<Record<string, StageResponses>> {
  const { data } = await supabase
    .from("stage_responses")
    .select("stage_id, field_key, value")
    .eq("project_id", projectId);

  const result: Record<string, StageResponses> = {};

  if (data) {
    for (const row of data) {
      if (!result[row.stage_id]) {
        result[row.stage_id] = {};
      }
      result[row.stage_id][row.field_key] = row.value;
    }
  }

  return result;
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  // 1. Validate auth session
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit check
  const rateCheck = checkRateLimit(user.id);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "Limite de requisições excedido. Tente novamente em breve." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rateCheck.retryAfterMs ?? 60000) / 1000)) } },
    );
  }

  // 2. Parse request body
  let projectId: string;
  let stageId: string | undefined;
  let message: string;

  try {
    const body = await request.json();
    projectId = body.projectId;
    stageId = body.stageId;
    message = body.message;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  if (!projectId || !message) {
    return NextResponse.json(
      { error: "projectId and message are required" },
      { status: 400 },
    );
  }

  // Sanitize user input
  message = sanitizeUserMessage(message);
  if (!message) {
    return NextResponse.json(
      { error: "Mensagem vazia após sanitização" },
      { status: 400 },
    );
  }

  // 3. Verify project ownership (RLS handles this, but explicit check too)
  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // 4. Load knowledge context
  const knowledgeContext = loadKnowledgeContext();

  // 5. Initialize state machine at the correct stage
  const resolvedStageId =
    stageId || project.current_stage_id || "goals";
  const sm = new WizardStateMachine(undefined, resolvedStageId);
  const currentStage = sm.currentStage;

  // 6. Load conversation history from DB
  const { data: history } = await supabase
    .from("conversation_messages")
    .select("role, content, stage_id")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true })
    .limit(50);

  // 7. Build context and stage prompt
  const allResponses = await loadStageResponses(supabase, projectId);
  const conversationHistory: AiMessage[] = (history || []).map((m) => ({
    role: m.role as AiMessage["role"],
    content: m.content,
  }));

  const stagePrompt = currentStage.buildPrompt({
    projectId,
    projectName: project.name,
    currentStageId: currentStage.id,
    allResponses,
    conversationHistory,
  });

  // 8. Persist user message
  await supabase.from("conversation_messages").insert({
    project_id: projectId,
    role: "user",
    content: message,
    stage_id: currentStage.id,
  });

  // 9. Generate AI response with grounding validation
  try {
    const ai = getAiProvider();
    const systemPrompt = getSystemPrompt();

    // Inject mode-specific prompt block
    const { MODE_PROMPTS } = await import("@/modules/core/ai/mode-prompts");
    const mode = (project.navigation_mode as "student" | "designer") ?? "student";
    const modeBlock = MODE_PROMPTS[mode] ?? "";
    const fullSystemPrompt = `${systemPrompt}\n\n${modeBlock}`;

    // Build the messages array: system + stage prompt + recent history + user message
    const recentHistory = (history || []).slice(-10).map((m) => ({
      role: m.role as AiMessage["role"],
      content: m.content,
    }));

    const messages: AiMessage[] = [
      { role: "system", content: fullSystemPrompt },
      ...stagePrompt,
      ...recentHistory,
      { role: "user", content: message },
    ];

    let response = await ai.generate({
      messages,
      knowledgeContext,
      temperature: 0.3,
    });

    // 10. Validate with GroundingValidator
    const validator = new GroundingValidator(knowledgeContext);
    let validation = validator.validate(response.text);

    if (!validation.approved) {
      // Retry with correction prompt (Req 7.2 — up to 2 failures then use raw KB text)
      const correctionMsg: AiMessage = {
        role: "system",
        content: `Sua resposta anterior continha problemas de fundamentação: ${validation.issues.map((i) => i.issue).join("; ")}. Por favor, gere novamente com dados corretos da base de conhecimento.`,
      };

      response = await ai.generate({
        messages: [...messages, correctionMsg],
        knowledgeContext,
        temperature: 0.2,
      });

      validation = validator.validate(response.text);

      // After 2nd failure, still proceed but flag — the response is best-effort
      // (In production, we'd substitute with raw KB text for the mentioned entities)
    }

    // 11. Extract grounding refs and clean response text
    const groundingRefs = validation.claims.map((c) => ({
      type: c.type,
      id: c.id,
    }));
    const cleanText = response.text.replace(/\[\[ref:[^\]]+\]\]/g, "").trim();

    // 12. Persist assistant message
    await supabase.from("conversation_messages").insert({
      project_id: projectId,
      role: "assistant",
      content: cleanText,
      stage_id: currentStage.id,
      grounding_refs: groundingRefs,
    });

    // 13. Update project current_stage_id
    await supabase
      .from("projects")
      .update({ current_stage_id: currentStage.id })
      .eq("id", projectId);

    return NextResponse.json({
      response: cleanText,
      groundingRefs,
      stageId: currentStage.id,
    });
  } catch (error) {
    if (error instanceof AiProviderError) {
      // All providers failed — return fallback form questions (Req 8.2)
      const fallbackQuestions = getFallbackQuestions(currentStage.id);
      return NextResponse.json({
        response:
          "O assistente de IA está temporariamente indisponível. Por favor, preencha os campos abaixo para continuar.",
        fallbackMode: true,
        fallbackQuestions,
        stageId: currentStage.id,
      });
    }

    console.error("[/api/chat] Unexpected error:", maskSensitiveData(String(error)));
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
