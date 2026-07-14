/**
 * GET /api/integrations/google-drive/callback
 *
 * OAuth callback: exchanges code for tokens, encrypts, stores in DB.
 */

import { NextResponse } from "next/server";
import { google } from "googleapis";
import { createServerClient } from "@/lib/supabase/server";
import { encryptTokens } from "@/modules/integrations/google-drive";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // user.id

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/settings?drive_error=missing_code", request.url),
    );
  }

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.id !== state) {
    return NextResponse.redirect(
      new URL("/settings?drive_error=unauthorized", request.url),
    );
  }

  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    `${appUrl}/api/integrations/google-drive/callback`,
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      return NextResponse.redirect(
        new URL("/settings?drive_error=no_refresh_token", request.url),
      );
    }

    // Encrypt tokens before storing
    const encrypted = encryptTokens({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date,
    });

    // Upsert integration record
    await supabase.from("user_integrations").upsert(
      {
        user_id: user.id,
        provider: "google-drive",
        encrypted_tokens: encrypted,
        scopes: ["drive.file"],
        connected_at: new Date().toISOString(),
      },
      { onConflict: "user_id,provider" },
    );

    return NextResponse.redirect(new URL("/settings?drive=connected", request.url));
  } catch {
    return NextResponse.redirect(
      new URL("/settings?drive_error=token_exchange_failed", request.url),
    );
  }
}
