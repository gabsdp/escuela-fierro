import { createClient } from "@/lib/supabase/server";
import { GraduationCap, Clock } from "lucide-react";
import Link from "next/link";
import { PRODUCT_LABELS, type ProductKey } from "@/lib/types";

export default async function EscuelaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Check if admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin";

  let courses;

  if (isAdmin) {
    // Admin sees all published courses
    const { data } = await supabase
      .from("courses")
      .select("*")
      .eq("published", true)
      .order("order_index", { ascending: true });
    courses = data;
  } else {
    // Student only sees assigned courses
    const { data: assignments } = await supabase
      .from("user_courses")
      .select("course_id")
      .eq("user_id", user.id);

    const assignedIds = assignments?.map((a) => a.course_id) ?? [];

    if (assignedIds.length === 0) {
      return (
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <div className="bg-[#F5A623]/10 rounded-full p-5 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <Clock className="h-10 w-10 text-[#F5A623]" />
          </div>
          <h1 className="text-2xl font-bold text-[#1B3A7A] mb-2">
            Tu acceso está siendo configurado
          </h1>
          <p className="text-[#666666] max-w-md mx-auto">
            El equipo de Fierro está preparando tus cursos. Te notificaremos cuando
            tengas contenido disponible.
          </p>
        </div>
      );
    }

    const { data } = await supabase
      .from("courses")
      .select("*")
      .in("id", assignedIds)
      .eq("published", true)
      .order("order_index", { ascending: true });
    courses = data;
  }

  const coursesWithProgress = await Promise.all(
    (courses ?? []).map(async (course) => {
      const { count: totalModules } = await supabase
        .from("modules")
        .select("*", { count: "exact", head: true })
        .eq("course_id", course.id)
        .eq("published", true);

      const { data: moduleIds } = await supabase
        .from("modules")
        .select("id")
        .eq("course_id", course.id)
        .eq("published", true);

      const ids = moduleIds?.map((m) => m.id) ?? [];

      let completedModules = 0;
      if (ids.length > 0) {
        const { count } = await supabase
          .from("user_progress")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .in("module_id", ids)
          .eq("completed", true);
        completedModules = count ?? 0;
      }

      return {
        ...course,
        total_modules: totalModules ?? 0,
        completed_modules: completedModules,
      };
    }),
  );

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-[#1B3A7A] flex items-center gap-2">
          <GraduationCap className="h-6 w-6 sm:h-7 sm:w-7 text-[#F5A623]" />
          Escuela Fierro
        </h1>
        <p className="text-sm sm:text-base text-[#666666] mt-1">
          Cursos disponibles para vos
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {coursesWithProgress.map((course) => (
          <Link
            key={course.id}
            href={`/escuela/${course.id}`}
            className="group bg-white rounded-xl border border-[#E0E0E0] overflow-hidden hover:shadow-lg hover:border-[#1E6FBF]/30 transition-all duration-200 p-4 sm:p-5"
          >
            <div className="flex items-start justify-between mb-2 sm:mb-3">
              <span className="text-xs font-semibold text-[#1E6FBF] bg-[#1E6FBF]/10 px-2 py-0.5 rounded-full">
                {PRODUCT_LABELS[course.product_key as ProductKey] ?? course.product_key}
              </span>
              {course.total_modules > 0 && (
                <span className="text-xs text-[#666666]">
                  {course.completed_modules}/{course.total_modules}
                </span>
              )}
            </div>

            <h3 className="font-semibold text-sm sm:text-base text-[#212121] group-hover:text-[#1B3A7A] transition-colors mb-1 sm:mb-2">
              {course.title}
            </h3>

            {course.description && (
              <p className="text-xs sm:text-sm text-[#666666] line-clamp-2 mb-3 sm:mb-4">
                {course.description}
              </p>
            )}

            {course.total_modules > 0 && (
              <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                <div
                  className="bg-green-500 h-1.5 sm:h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${(course.completed_modules / course.total_modules) * 100}%`,
                  }}
                />
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
