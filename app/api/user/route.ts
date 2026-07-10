/**
 * DELETE /api/user
 *
 * LGPD: Direito ao apagamento (Art. 18, VI).
 * Deleta todos os dados do usuário autenticado:
 * - Projetos (cascateia para messages, stage_responses, attachments, scope_documents)
 * - Registro na tabela users
 * - NÃO deleta o auth.users (isso requer service_role ou o próprio usuário via Supabase UI)
 *
 * O usuário deve confirmar esta ação no frontend antes de chamar este endpoint.
 */

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { clearRateLimit } from "@/lib/security/rate-limit";

export async function DELETE() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Delete all projects (CASCADE will remove messages, responses, attachments, documents)
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

  // Delete user profile
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

  // Clear rate limit data
  clearRateLimit(user.id);

  // Sign out the user
  await supabase.auth.signOut();

  return NextResponse.json({
    success: true,
    message: "Todos os seus dados foram excluídos com sucesso.",
  });
}
