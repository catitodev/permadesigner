/**
 * POST /api/upload
 * Multipart form: file (image), projectId, category
 *
 * Uploads a photo to Supabase Storage under:
 *   projects/{projectId}/nature/{category}/{filename}
 *
 * Saves a record in `project_attachments`.
 * Limits: 5MB max, jpg/png/webp only.
 *
 * Requirements: 5.3
 */

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(request: Request) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const projectId = formData.get("projectId") as string | null;
  const category = formData.get("category") as string | null;

  if (!file || !projectId || !category) {
    return NextResponse.json(
      { error: "file, projectId e category são obrigatórios" },
      { status: 400 },
    );
  }

  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Formato inválido. Aceitos: JPG, PNG, WebP." },
      { status: 400 },
    );
  }

  // Validate file size
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "Arquivo muito grande. Máximo: 5MB." },
      { status: 400 },
    );
  }

  // Verify project ownership (RLS covers this, but explicit check)
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .single();

  if (!project) {
    return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 });
  }

  // Build storage path
  const ext = file.name.split(".").pop() ?? "jpg";
  const safeName = `${Date.now()}.${ext}`;
  const storagePath = `projects/${projectId}/nature/${category}/${safeName}`;

  // Upload to Supabase Storage
  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from("attachments")
    .upload(storagePath, arrayBuffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json(
      { error: "Falha no upload. Tente novamente." },
      { status: 500 },
    );
  }

  // Save record in project_attachments
  const { error: dbError } = await supabase.from("project_attachments").insert({
    project_id: projectId,
    storage_path: storagePath,
    linked_category: category,
  });

  if (dbError) {
    // Cleanup uploaded file on DB failure
    await supabase.storage.from("attachments").remove([storagePath]);
    return NextResponse.json(
      { error: "Falha ao salvar referência. Tente novamente." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    storagePath,
    category,
  });
}
