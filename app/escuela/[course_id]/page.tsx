import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";
import { PRODUCT_LABELS, type ProductKey } from "@/lib/types";

export default async function CourseModulesPage({
  params,
}: {
  params: Promise<{ course_id: string }>;
}) {
  const { course_id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("id", course_id)
    .single();

  if (!course) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-[#666666]">Curso no encontrado.</p>
        <Link href="/escuela" className="text-[#1E6FBF] mt-2 inline-block">
          Volver a la escuela
        </Link>
      </div>
    );
  }

  const { data: modules } = await supabase
    .from("modules")
    .select("*")
    .eq("course_id", course_id)
    .eq("published", true)
    .order("order_index", { ascending: true });

  const { data: progress } = await supabase
    .from("user_progress")
    .select("module_id, completed")
    .eq("user_id", user.id);

  const progressMap = new Map<string, boolean>();
  progress?.forEach((p) => progressMap.set(p.module_id, p.completed));

  const moduleList = modules ?? [];
  const completedCount = moduleList.filter((m) => progressMap.get(m.id)).length;

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <Link
          href="/escuela"
          className="inline-flex items-center gap-1.5 text-sm text-[#1E6FBF] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a la escuela
        </Link>

        <span className="text-xs font-semibold text-[#1E6FBF] bg-[#1E6FBF]/10 px-2 py-0.5 rounded-full">
          {PRODUCT_LABELS[course.product_key as ProductKey] ?? course.product_key}
        </span>
      </div>

      <h1 className="text-xl sm:text-2xl font-bold text-[#1B3A7A] mb-2">{course.title}</h1>

      {course.description && (
        <p className="text-sm sm:text-base text-[#666666] mb-4">{course.description}</p>
      )}

      {moduleList.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-gray-200 rounded-full h-2.5 max-w-xs">
              <div
                className="bg-green-500 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${(completedCount / moduleList.length) * 100}%` }}
              />
            </div>
            <span className="text-sm text-[#666666] font-medium">
              {completedCount}/{moduleList.length} módulos
            </span>
          </div>
        </div>
      )}

      {moduleList.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-[#666666]">No hay módulos disponibles en este curso todavía.</p>
        </div>
      ) : (
        <div className="space-y-2 sm:space-y-3 mt-4 sm:mt-6">
          {moduleList.map((mod, i) => {
            const completed = progressMap.get(mod.id) ?? false;

            return (
              <Link
                key={mod.id}
                href={`/escuela/${course_id}/${mod.id}`}
                className="flex items-center gap-3 sm:gap-4 bg-white border border-[#E0E0E0] rounded-lg p-3 sm:p-4 hover:border-[#1E6FBF]/30 hover:shadow-sm transition-all group"
              >
                <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#1B3A7A]/10 flex items-center justify-center">
                  <span className="text-[#1B3A7A] font-bold text-xs sm:text-sm">
                    {i + 1}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm sm:text-base text-[#212121] group-hover:text-[#1B3A7A] transition-colors truncate">
                    {mod.title}
                  </h3>
                </div>

                {completed ? (
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
                ) : (
                  <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-[#E0E0E0] flex-shrink-0" />
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
