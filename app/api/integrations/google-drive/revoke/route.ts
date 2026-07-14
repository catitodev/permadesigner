/**
 * POST /api/integrations/google-drive/revoke
 *
 * Disconnects Google Drive: revokes token at Google, deletes DB record.
 */

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { decryptTokens, GoogleDriveAdapter } from "@/modules/integrations/google-drive";
import type { GoogleDriveTokens } from "@/modules/integrations/google-drive";

export async function POST() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch integration
  const { data: integration } = await supabase
    .from("user_integrations")
    .select("id, encrypted_tokens")
    .eq("user_id", user.id)
    .eq("provider", "google-drive")
    .single();

  if (!integration) {
    return NextResponse.json({ error: "Integration not found" }, { status: 404 });
  }

  // Revoke token at Google (best-effort)
  try {
    const tokens = decryptTokens<GoogleDriveTokens>(integration.encrypted_tokens);
    const adapter = new GoogleDriveAdapter(tokens);
    await adapter.revokeAccess();
  } catch {
    // Continue with deletion even if revocation fails
  }

  // Delete DB record
  await supabase
    .from("user_integrations")
    .delete()
    .eq("id", integration.id);

  return NextResponse.json({ success: true });
}
