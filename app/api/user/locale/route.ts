import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

const VALID_LOCALES = ["pt-BR", "en", "es"];

export async function POST(request: Request) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { locale } = await request.json();
  if (!VALID_LOCALES.includes(locale)) {
    return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
  }

  await supabase.from("users").update({ locale }).eq("id", user.id);
  return NextResponse.json({ success: true });
}
