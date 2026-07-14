/**
 * POST /api/projects/mode
 * Body: { projectId: string, mode: 'student' | 'designer' }
 *
 * Updates the navigation_mode of a project.
 */

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

const VALID_MODES = ["student", "designer"];

export async function POST(request: Request) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, mode } = await request.json();

  if (!projectId || !VALID_MODES.includes(mode)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { error } = await supabase
    .from("projects")
    .update({ navigation_mode: mode })
    .eq("id", projectId);

  if (error) {
    return NextResponse.json({ error: "Failed to update mode" }, { status: 500 });
  }

  return NextResponse.json({ success: true, mode });
}
