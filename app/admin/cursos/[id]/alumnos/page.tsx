import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, User } from "lucide-react";
import Link from "next/link";
import { PRODUCT_LABELS, type ProductKey } from "@/lib/types";
import ReminderPanel from "@/components/ReminderPanel";

interface StudentProgress {
  id: string;
  full_name: string;
  email: string;
  total_modules: number;
  completed_modules: number;
}

export default async function AlumnosCursoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: courseId } = await params;
  const supabase = await createClient();

  const { data: course } = await supabase
    .from("courses").select("*").eq("id", courseId).single();

  if (!course) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <p className="text-[#666666]">Curso no encontrado.</p>
        <Link href="/admin" className="text-[#1E6FBF] mt-2 inline-block">
          Volver al panel
        </Link>
      </div>
    );
  }

  const { data: assignments } = await supabase
    .from("user_courses").select("user_id").eq("course_id", courseId);

  const { data: modules } = await supabase
    .from("modules").select("id").eq("course_id", courseId).eq("published", true);
  const moduleIds = (modules ?? []).map((m) => m.id);
  const totalModules = moduleIds.length;

  let students: StudentProgress[] = [];

  if (assignments && assignments.length > 0) {
    const userIds = assignments.map((a) => a.user_id);

    const { data: profiles } = await supabase
      .from("profiles").select("id, full_name, email")
      .in("id", userIds)
      .order("full_name", { ascending: true });

    if (profiles) {
      const studentProgress = await Promise.all(
        profiles.map(async (profile) => {
          let completedModules = 0;
          if (moduleIds.length > 0) {
            const { count } = await supabase
              .from("user_progress")
              .select("*", { count: "exact", head: true })
              .eq("user_id", profile.id)
              .in("module_id", moduleIds)
              .eq("completed", true);
            completedModules = count ?? 0;
          }
          return {
            id: profile.id,
            full_name: profile.full_name,
            email: profile.email,
            total_modules: totalModules,
            completed_modules: completedModules,
          };
        }),
      );
      students = studentProgress;
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-sm text-[#1E6FBF] hover:underline mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al panel
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <span className="text-xs font-semibold text-[#1E6FBF] bg-[#1E6FBF]/10 px-2 py-0.5 rounded-full mb-2 inline-block">
            {PRODUCT_LABELS[course.product_key as ProductKey] ?? course.product_key}
          </span>
          <h1 className="text-2xl font-bold text-[#1B3A7A] flex items-center gap-2">
            <User className="h-6 w-6 text-[#F5A623]" />
            Alumnos: {course.title}
          </h1>
          <p className="text-[#666666] mt-1">
            {students.length} alumno{students.length !== 1 ? "s" : ""} · {totalModules} módulos
          </p>
        </div>
      </div>

      {students.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E0E0E0] p-12 text-center">
          <User className="h-12 w-12 text-[#E0E0E0] mx-auto mb-3" />
          <p className="text-[#666666]">No hay alumnos asignados a este curso todavía.</p>
          <Link
            href="/admin/usuarios"
            className="text-[#1E6FBF] text-sm mt-2 inline-block hover:underline"
          >
            Ir a gestión de usuarios
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E0E0E0] overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-[#E0E0E0] text-xs font-semibold text-[#666666] uppercase tracking-wider">
            <div className="col-span-3">Alumno</div>
            <div className="col-span-3">Email</div>
            <div className="col-span-6">Progreso</div>
          </div>

          {students.map((student) => (
            <div
              key={student.id}
              className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-[#E0E0E0] hover:bg-gray-50 transition-colors"
            >
              <div className="col-span-3 flex items-center">
                <Link
                  href={`/admin/usuarios/${student.id}`}
                  className="text-sm font-medium text-[#212121] hover:text-[#1B3A7A] hover:underline"
                >
                  {student.full_name || "Sin nombre"}
                </Link>
              </div>
              <div className="col-span-3 flex items-center">
                <span className="text-sm text-[#666666] truncate">{student.email}</span>
              </div>
              <div className="col-span-6 flex items-center gap-3">
                <div className="flex-1">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-green-500 h-2.5 rounded-full transition-all"
                      style={{
                        width: student.total_modules > 0
                          ? `${(student.completed_modules / student.total_modules) * 100}%`
                          : "0%",
                      }}
                    />
                  </div>
                </div>
                <span className="text-sm font-medium text-[#666666] w-16 text-right">
                  {student.completed_modules}/{student.total_modules}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6">
        <ReminderPanel courseId={courseId} />
      </div>
    </div>
  );
}
