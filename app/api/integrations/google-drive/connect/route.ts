/**
 * GET /api/integrations/google-drive/connect
 *
 * Initiates incremental OAuth for Google Drive (scope: drive.file).
 * Redirects the user to Google's consent screen.
 */

import { NextResponse } from "next/server";
import { google } from "googleapis";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: "Google Drive integration not configured." },
      { status: 503 },
    );
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    `${appUrl}/api/integrations/google-drive/callback`,
  );

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/drive.file"],
    prompt: "consent",
    state: user.id, // pass user id to callback
  });

  return NextResponse.redirect(authUrl);
}
