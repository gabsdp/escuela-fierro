import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const supabaseAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

export async function POST(request: Request) {
  try {
    const { course_id } = await request.json();
    if (!course_id) {
      return NextResponse.json({ error: "Falta course_id" }, { status: 400 });
    }

    const supabase = supabaseAdmin();

    const { data: config } = await supabase
      .from("reminder_configs")
      .select("*")
      .eq("course_id", course_id)
      .eq("enabled", true)
      .single();

    if (!config) {
      return NextResponse.json({ error: "No hay recordatorio configurado para este curso" }, { status: 400 });
    }

    const { data: assignments } = await supabase
      .from("user_courses")
      .select("user_id, assigned_at")
      .eq("course_id", course_id);

    if (!assignments || assignments.length === 0) {
      return NextResponse.json({ sent: 0, message: "No hay alumnos asignados" });
    }

    const { data: modules } = await supabase
      .from("modules")
      .select("id")
      .eq("course_id", course_id)
      .eq("published", true);
    const moduleIds = (modules ?? []).map((m) => m.id);

    const { data: course } = await supabase
      .from("courses")
      .select("title")
      .eq("id", course_id)
      .single();

    const courseTitle = course?.title ?? "el curso";
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - config.days_inactive);

    let sent = 0;

    for (const assignment of assignments) {
      if (new Date(assignment.assigned_at) > cutoff) continue;

      let completed = 0;
      if (moduleIds.length > 0) {
        const { count } = await supabase
          .from("user_progress")
          .select("*", { count: "exact", head: true })
          .eq("user_id", assignment.user_id)
          .in("module_id", moduleIds)
          .eq("completed", true);
        completed = count ?? 0;
      }

      if (completed > 0) continue;

      const recentCutoff = new Date();
      recentCutoff.setDate(recentCutoff.getDate() - config.days_inactive);
      const { count: recentReminders } = await supabase
        .from("reminder_logs")
        .select("*", { count: "exact", head: true })
        .eq("user_id", assignment.user_id)
        .eq("course_id", course_id)
        .gte("sent_at", recentCutoff.toISOString());

      if ((recentReminders ?? 0) > 0) continue;

      const { data: profile } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("id", assignment.user_id)
        .single();

      if (!profile?.email) continue;

      const displayName = profile.full_name || "Alumno";

      await resend.emails.send({
        from: "Escuela Fierro <onboarding@resend.dev>",
        to: profile.email,
        subject: `¿Cómo vas con ${courseTitle}?`,
        html: `
          <h2>¡Hola ${displayName}!</h2>
          <p>${config.message.replace(/\{nombre\}/g, displayName).replace(/\{curso\}/g, courseTitle).replace(/\{dias\}/g, String(config.days_inactive))}</p>
          <p style="margin-top: 20px; font-size: 14px; color: #666;">
            Podés seguir avanzando desde la <a href="https://escuela.fierro.com.ar/escuela">Escuela Fierro</a>.
          </p>
        `,
      });

      await supabase.from("reminder_logs").insert({
        user_id: assignment.user_id,
        course_id,
      });

      sent++;
    }

    return NextResponse.json({ sent });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
