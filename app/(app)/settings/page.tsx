import { createServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ThemeSelect } from "./theme-select";
import { DeleteAccountSection } from "./delete-account";

/**
 * Settings page — three sections: Básicas, Privacidade/LGPD, Exclusão.
 * Req: AP-4
 */
export default async function SettingsPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("users")
    .select("theme_preference")
    .eq("id", user!.id)
    .single();

  return (
    <div className="mx-auto w-full max-w-2xl overflow-auto px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Configurações</h1>

      <div className="space-y-6">
        {/* Básicas */}
        <Card>
          <CardHeader>
            <CardTitle>Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ThemeSelect currentTheme={profile?.theme_preference ?? "system"} />
            <div className="text-sm text-muted-foreground">
              Idioma e Google Drive estarão disponíveis em breve.
            </div>
          </CardContent>
        </Card>

        {/* Privacidade e LGPD */}
        <Card>
          <CardHeader>
            <CardTitle>Privacidade e LGPD</CardTitle>
            <CardDescription>Seus direitos conforme a Lei 13.709/2018</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>Coletamos apenas os dados necessários para o funcionamento do app:</p>
            <ul className="ml-4 list-disc space-y-1 text-muted-foreground">
              <li>Email e nome (via Google)</li>
              <li>Respostas do processo de design</li>
              <li>Fotos anexadas aos projetos</li>
              <li>Preferências (tema, idioma)</li>
            </ul>
            <p className="font-medium mt-3">Seus direitos:</p>
            <ul className="ml-4 list-disc space-y-1 text-muted-foreground">
              <li>Confirmação de tratamento de dados</li>
              <li>Acesso aos seus dados</li>
              <li>Correção de dados incompletos</li>
              <li>Anonimização ou eliminação</li>
              <li>Portabilidade (exportação)</li>
              <li>Revogação de consentimento</li>
            </ul>
            <div className="pt-3">
              <a
                href="/api/user/export"
                className="inline-flex rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-accent transition-colors"
              >
                Exportar todos os meus dados
              </a>
            </div>
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
