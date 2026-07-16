import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { OfflineIndicator } from "@/components/offline-indicator";
import { Footer } from "@/components/footer";
import { UserMenu } from "@/components/user-menu";

/**
 * Authenticated layout for all routes under (app) group.
 * h-screen ensures the whole UI fits in the viewport without page scroll.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const avatarUrl = user.user_metadata?.avatar_url ?? null;
  const displayName = user.user_metadata?.full_name ?? user.user_metadata?.name ?? "";
  const email = user.email ?? "";

  return (
    <div className="flex h-screen flex-col">
      <header className="flex shrink-0 items-center justify-between border-b px-4 py-2">
        <Link href="/dashboard" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <img src="/icons/icon-192.png" alt="" className="size-8 rounded-lg" />
          <span className="text-sm font-bold tracking-tight text-foreground">PermaDesigner</span>
        </Link>
        <UserMenu avatarUrl={avatarUrl} displayName={displayName} email={email} />
      </header>
      <main className="min-h-0 flex-1 overflow-auto">{children}</main>
      <Footer />
      <OfflineIndicator />
    </div>
  );
}
