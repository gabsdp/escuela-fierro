import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get("course_id");
  if (!courseId) {
    return NextResponse.json({ error: "Falta course_id" }, { status: 400 });
  }

  const supabase = supabaseAdmin();
  const { data: config } = await supabase
    .from("reminder_configs")
    .select("*")
    .eq("course_id", courseId)
    .maybeSingle();

  const now = new Date();
  const { count: sentRecently } = await supabase
    .from("reminder_logs")
    .select("*", { count: "exact", head: true })
    .eq("course_id", courseId)
    .gte("sent_at", new Date(now.setDate(now.getDate() - 7)).toISOString());

  return NextResponse.json({
    config: config ?? null,
    reminders_sent_7d: sentRecently ?? 0,
  });
}

export async function POST(request: Request) {
  try {
    const { course_id, days_inactive, message, enabled } = await request.json();
    if (!course_id) {
      return NextResponse.json({ error: "Falta course_id" }, { status: 400 });
    }

    const supabase = supabaseAdmin();

    const { error } = await supabase
      .from("reminder_configs")
      .upsert({
        course_id,
        days_inactive: days_inactive ?? 5,
        message: message ?? "Hola, vemos que todavía no comenzaste el curso. ¿Necesitás ayuda? Escribinos a soporte@fierro.com.ar",
        enabled: enabled ?? true,
        updated_at: new Date().toISOString(),
      }, { onConflict: "course_id" });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
