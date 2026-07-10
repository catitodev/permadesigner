import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

/**
 * OAuth callback route handler.
 * Supabase redirects here after the user completes Google consent.
 * Exchanges the authorization code for a session, then redirects
 * to /dashboard on success or /login?error=auth_failed on failure.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL("/dashboard", origin));
    }
  }

  // If no code or exchange failed, redirect to login with error
  return NextResponse.redirect(
    new URL("/login?error=auth_failed", new URL(request.url).origin),
  );
}
