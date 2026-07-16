import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeSelect } from "./theme-select";
import { LocaleSelect } from "./locale-select";
import { DriveToggle } from "./drive-toggle";
import { DeleteAccountSection } from "./delete-account";
import { InstallApp } from "./install-app";

/**
 * Settings page — Básicas, Privacidade (link only), Exclusão.
 * Uses PermaBrasilis brand tokens.
 */
export default async function SettingsPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("users")
    .select("theme_preference, locale")
    .eq("id", user!.id)
    .single();

  // Check if Drive is connected
  const { data: driveIntegration } = await supabase
    .from("user_integrations")
    .select("id")
    .eq("user_id", user!.id)
    .eq("provider", "google-drive")
    .single();

  return (
    <div className="mx-auto w-full max-w-2xl overflow-auto px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-perma-green">Configurações</h1>

      <div className="space-y-6">
        {/* Install App (mobile only) */}
        <InstallApp />

        {/* Básicas */}
        <Card className="border-perma-green/20">
          <CardHeader>
            <CardTitle className="text-perma-green">Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <ThemeSelect currentTheme={profile?.theme_preference ?? "system"} />
            <LocaleSelect currentLocale={profile?.locale ?? "pt-BR"} />
            <DriveToggle connected={!!driveIntegration} />
          </CardContent>
        </Card>

        {/* Privacidade — apenas link, sem duplicar conteúdo */}
        <Card className="border-perma-teal/20">
          <CardHeader>
            <CardTitle className="text-perma-teal">Privacidade e dados</CardTitle>
            <CardDescription>Gerencie seus dados conforme a LGPD</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Link href="/privacidade">
              <Button variant="outline" className="border-perma-teal/30 hover:bg-perma-teal/5">
                Ver Política de Privacidade
              </Button>
            </Link>
            <a href="/api/user/export">
              <Button variant="outline" className="border-perma-teal/30 hover:bg-perma-teal/5">
                Exportar todos os meus dados
              </Button>
            </a>
          </CardContent>
        </Card>

        {/* Exclusão de conta */}
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-destructive">Exclusão de conta</CardTitle>
            <CardDescription>
              Esta ação é irreversível. Todos os seus dados serão apagados.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DeleteAccountSection />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
