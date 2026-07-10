/**
 * POST /api/export/email
 * Body: { projectId: string }
 *
 * Generates a PDF of the DesignScopeDocument and sends it to the
 * authenticated user's email address (the same used for Google login).
 *
 * Uses Resend (free tier: 100 emails/day, no credit card).
 * Requires RESEND_API_KEY environment variable.
 */

import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createServerClient } from "@/lib/supabase/server";
import { buildScopeDocument } from "@/modules/core/documents";
import { generatePdfBuffer } from "@/modules/scope-export/pdf/generate-pdf";
import type { StageResponses } from "@/modules/core/documents";

export async function POST(request: Request) {
  // Auth check
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse body
  let projectId: string;
  try {
    const body = await request.json();
    projectId = body.projectId;
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  if (!projectId) {
    return NextResponse.json({ error: "projectId é obrigatório" }, { status: 400 });
  }

  // Check Resend API key
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return NextResponse.json(
      { error: "Envio de email não configurado. Adicione RESEND_API_KEY." },
      { status: 503 },
    );
  }

  // Fetch project (RLS ensures ownership)
  const { data: project } = await supabase
    .from("projects")
    .select("id, name")
    .eq("id", projectId)
    .single();

  if (!project) {
    return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 });
  }

  // Load stage responses
  const { data: responseRows } = await supabase
    .from("stage_responses")
    .select("stage_id, field_key, value")
    .eq("project_id", projectId);

  const allResponses: Record<string, StageResponses> = {};
  for (const row of responseRows ?? []) {
    if (!allResponses[row.stage_id]) {
      allResponses[row.stage_id] = {};
    }
    allResponses[row.stage_id][row.field_key] = row.value;
  }

  // Build document + generate PDF
  const scopeDoc = buildScopeDocument(projectId, project.name, allResponses);
  const pdfBuffer = await generatePdfBuffer(scopeDoc);

  // Send email via Resend
  const resend = new Resend(resendKey);
  const filename = `${project.name.replace(/[^a-zA-Z0-9\u00C0-\u024F -]/g, "")}.pdf`;

  try {
    await resend.emails.send({
      from: "PermaDesigner <noreply@permadesigner.app>",
      to: user.email,
      subject: `Seu documento de escopo: ${project.name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2d6a4f;">🌱 PermaDesigner</h2>
          <p>Olá!</p>
          <p>Segue em anexo o documento de escopo do seu projeto <strong>"${project.name}"</strong>.</p>
          <p>Status: <strong>${scopeDoc.status === "complete" ? "Planejamento Completo" : "Planejamento Inicial"}</strong></p>
          ${
            scopeDoc.sections.missingSections && scopeDoc.sections.missingSections.length > 0
              ? `<p style="color: #c2552a; font-size: 14px;">⚠ Seções ainda pendentes: ${scopeDoc.sections.missingSections.join(", ")}</p>`
              : ""
          }
          <p style="margin-top: 24px; font-size: 12px; color: #666;">
            Este email foi enviado por PermaDesigner. Se não foi você quem solicitou, ignore esta mensagem.
          </p>
        </div>
      `,
      attachments: [
        {
          filename,
          content: pdfBuffer.toString("base64"),
        },
      ],
    });

    return NextResponse.json({
      success: true,
      message: `Documento enviado para ${user.email}`,
    });
  } catch (error) {
    console.error("[/api/export/email] Send failed:", error);
    return NextResponse.json(
      { error: "Falha ao enviar email. Tente novamente." },
      { status: 500 },
    );
  }
}
