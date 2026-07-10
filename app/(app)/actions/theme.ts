"use server";

import { createServerClient } from "@/lib/supabase/server";

const VALID_THEMES = ["system", "light", "dark"] as const;
type ThemePreference = (typeof VALID_THEMES)[number];

/**
 * Persists the user's theme preference in the `users` table.
 * Validates that the theme value is one of: system, light, dark.
 */
export async function saveThemePreference(theme: string) {
  if (!VALID_THEMES.includes(theme as ThemePreference)) {
    return { error: "Tema inválido. Use: system, light ou dark." };
  }

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Usuário não autenticado." };
  }

  const { error } = await supabase
    .from("users")
    .update({ theme_preference: theme })
    .eq("id", user.id);

  if (error) {
    return { error: "Falha ao salvar preferência de tema." };
  }

  return { success: true };
}
