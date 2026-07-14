/**
 * DELETE /api/user
 *
 * LGPD: Direito ao apagamento (Art. 18, VI).
 * 1. Revoga integrações externas (Google Drive tokens)
 * 2. Deleta projetos (CASCADE para messages, responses, attachments, documents)
 * 3. Deleta perfil do usuário
 * 4. Registra exclusão de forma auditável e anonimizada (email_hash)
 * 5. Encerra sessão
 *
 * Req: AP-4 (exclusão de conta), AP-3 (revogação Drive)
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabase/server";
import { clearRateLimit } from "@/lib/security/rate-limit";
import { createHash } from "crypto";

export async function DELETE() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1. Revoke Google Drive integration if exists
  const { data: integration } = await supabase
    .from("user_integrations")
    .select("id, encrypted_tokens")
    .eq("user_id", user.id)
    .eq("provider", "google-drive")
    .single();

  if (integration) {
    // Best-effort revocation (don't block deletion if it fails)
    try {
      await supabase
        .from("user_integrations")
        .delete()
        .eq("id", integration.id);
    } catch {
      // Continue with deletion regardless
    }
  }

  // 2. Delete all projects (CASCADE removes messages, responses, attachments, documents)
  const { error: projectsError } = await supabase
    .from("projects")
    .delete()
    .eq("user_id", user.id);

  if (projectsError) {
    return NextResponse.json(
      { error: "Falha ao excluir projetos." },
      { status: 500 },
    );
  }

  // 3. Delete user profile
  const { error: userError } = await supabase
    .from("users")
    .delete()
    .eq("id", user.id);

  if (userError) {
    return NextResponse.json(
      { error: "Falha ao excluir perfil do usuário." },
      { status: 500 },
    );
  }

  // 4. Log deletion audit (anonimized — only hashed email, no PII)
  // Uses service_role client because account_deletions has no user-level RLS
  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const emailHash = createHash("sha256")
    .update(user.email ?? user.id)
    .digest("hex");

  await serviceClient.from("account_deletions").insert({
    email_hash: emailHash,
    reason: "user_request",
  });

  // 5. Clear rate limit + sign out
  clearRateLimit(user.id);
  await supabase.auth.signOut();

  return NextResponse.json({
    success: true,
    message: "Todos os seus dados foram excluídos com sucesso.",
  });
}
