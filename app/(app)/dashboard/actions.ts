"use server";

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";

/**
 * Creates a new project with the given name and redirects to it.
 */
export async function createProject(formData: FormData) {
  const name = formData.get("name") as string;

  if (!name || name.trim().length < 3) {
    return { error: "O nome do projeto deve ter pelo menos 3 caracteres." };
  }

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("projects")
    .insert({
      name: name.trim(),
      user_id: user.id,
      current_stage_id: "goals",
      completeness_status: "{}",
    })
    .select("id")
    .single();

  if (error) {
    console.error("[createProject] Supabase error:", error);
    return { error: `Erro ao criar o projeto: ${error.message}` };
  }

  redirect(`/projects/${data.id}`);
}

/**
 * Deletes a project by ID.
 */
export async function deleteProject(projectId: string) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId)
    .eq("user_id", user.id);

  if (error) {
    return { error: "Erro ao excluir o projeto." };
  }

  redirect("/dashboard");
}
