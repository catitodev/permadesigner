import { createServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";

/**
 * Profile page — displays user info from Google + app stats.
 * Req: AP-2
 */
export default async function ProfilePage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const avatarUrl = user?.user_metadata?.avatar_url ?? null;
  const displayName = user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? "Usuário";
  const email = user?.email ?? "";

  // Fetch user record for theme + created_at
  const { data: profile } = await supabase
    .from("users")
    .select("theme_preference, created_at")
    .eq("id", user!.id)
    .single();

  // Count projects
  const { count } = await supabase
    .from("projects")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user!.id);

  const themeLabel: Record<string, string> = {
    system: "Sistema",
    light: "Claro",
    dark: "Escuro",
  };

  return (
    <div className="mx-auto w-full max-w-2xl overflow-auto px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Perfil</h1>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={displayName}
                width={64}
                height={64}
                className="size-16 rounded-full"
              />
            ) : (
              <div className="flex size-16 items-center justify-center rounded-full bg-perma-green text-xl font-bold text-white">
                {displayName[0]?.toUpperCase() ?? "U"}
              </div>
            )}
            <div>
              <CardTitle>{displayName}</CardTitle>
              <p className="text-sm text-muted-foreground">{email}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <InfoRow label="Tema" value={themeLabel[profile?.theme_preference ?? "system"] ?? "Sistema"} />
          <InfoRow label="Projetos criados" value={String(count ?? 0)} />
          <InfoRow
            label="Conta criada em"
            value={profile?.created_at ? new Date(profile.created_at).toLocaleDateString("pt-BR") : "—"}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
