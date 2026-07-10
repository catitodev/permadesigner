/**
 * GET /api/export/[format]?projectId=xxx
 *
 * Generates a PDF or DOCX of the DesignScopeDocument for the given project.
 * Saves a new version in `scope_documents` and returns the file as download.
 *
 * Supported formats: "pdf", "docx"
 * Requirements: 6.4, 6.5, 6.6
 */

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { buildScopeDocument } from "@/modules/core/documents";
import { generatePdfBuffer } from "@/modules/scope-export/pdf/generate-pdf";
import { generateDocxBuffer } from "@/modules/scope-export/docx/generate-docx";
import type { StageResponses } from "@/modules/core/documents";

interface RouteParams {
  params: Promise<{ format: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const { format } = await params;

  // Validate format
  if (format !== "pdf" && format !== "docx") {
    return NextResponse.json(
      { error: "Formato inválido. Use: pdf ou docx" },
      { status: 400 },
    );
  }

  // Auth check
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get projectId from query
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json(
      { error: "projectId é obrigatório" },
      { status: 400 },
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

  // Determine next version number
  const { data: lastDoc } = await supabase
    .from("scope_documents")
    .select("version")
    .eq("project_id", projectId)
    .order("version", { ascending: false })
    .limit(1)
    .single();

  const nextVersion = (lastDoc?.version ?? 0) + 1;

  // Build the document
  const scopeDoc = buildScopeDocument(
    projectId,
    project.name,
    allResponses,
    nextVersion,
  );

  // Generate the file
  let buffer: Buffer;
  let contentType: string;
  let fileExtension: string;

  if (format === "pdf") {
    buffer = await generatePdfBuffer(scopeDoc);
    contentType = "application/pdf";
    fileExtension = "pdf";
  } else {
    buffer = await generateDocxBuffer(scopeDoc);
    contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    fileExtension = "docx";
  }

  // Save version record in scope_documents
  await supabase.from("scope_documents").insert({
    project_id: projectId,
    version: nextVersion,
    status: scopeDoc.status,
    content: scopeDoc,
  });

  // Return the file as a download
  const filename = `${project.name.replace(/[^a-zA-Z0-9\u00C0-\u024F -]/g, "")}_v${nextVersion}.${fileExtension}`;

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
