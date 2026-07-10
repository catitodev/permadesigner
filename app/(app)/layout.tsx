import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { ThemeToggle } from "@/components/theme-toggle";
import { OfflineIndicator } from "@/components/offline-indicator";
import { Footer } from "@/components/footer";

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

  return (
    <div className="flex h-screen flex-col">
      <header className="flex shrink-0 items-center justify-end border-b px-4 py-2">
        <ThemeToggle />
      </header>
      <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
      <Footer />
      <OfflineIndicator />
    </div>
  );
}
