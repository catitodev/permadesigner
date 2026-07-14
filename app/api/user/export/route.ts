/**
 * GET /api/user/export
 *
 * LGPD portabilidade: exports all user data as a JSON download.
 * Req: AP-5
 */

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch all user data (RLS ensures isolation)
  const [profileRes, projectsRes, messagesRes, responsesRes, observationsRes, documentsRes] =
    await Promise.all([
      supabase.from("users").select("*").eq("id", user.id).single(),
      supabase.from("projects").select("*").eq("user_id", user.id),
      supabase.from("conversation_messages").select("*").in(
        "project_id",
        (await supabase.from("projects").select("id").eq("user_id", user.id)).data?.map(p => p.id) ?? []
      ),
      supabase.from("stage_responses").select("*").in(
        "project_id",
        (await supabase.from("projects").select("id").eq("user_id", user.id)).data?.map(p => p.id) ?? []
      ),
      supabase.from("nature_observations").select("*").in(
        "project_id",
        (await supabase.from("projects").select("id").eq("user_id", user.id)).data?.map(p => p.id) ?? []
      ),
      supabase.from("scope_documents").select("*").in(
        "project_id",
        (await supabase.from("projects").select("id").eq("user_id", user.id)).data?.map(p => p.id) ?? []
      ),
    ]);

  const exportData = {
    exportedAt: new Date().toISOString(),
    profile: profileRes.data,
    projects: projectsRes.data,
    conversationMessages: messagesRes.data,
    stageResponses: responsesRes.data,
    natureObservations: observationsRes.data,
    scopeDocuments: documentsRes.data,
  };

  const json = JSON.stringify(exportData, null, 2);

  return new NextResponse(json, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="permadesigner-data-export.json"`,
      "Cache-Control": "no-store",
    },
  });
}
