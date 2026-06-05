import { createClient } from "@/lib/supabase/server";
import { Book, Users, Edit, PlusCircle, GraduationCap } from "lucide-react";
import Link from "next/link";
import { PRODUCT_LABELS, type CourseWithCounts, type ProductKey } from "@/lib/types";
import DuplicateCourseButton from "@/components/DuplicateCourseButton";

export default async function AdminPage() {
  const supabase = await createClient();

  const { data: courses } = await supabase
    .from("courses")
    .select("*")
    .order("order_index", { ascending: true });

  const coursesWithCounts = await Promise.all(
    (courses ?? []).map(async (course) => {
      const { count: moduleCount } = await supabase
        .from("modules")
        .select("*", { count: "exact", head: true })
        .eq("course_id", course.id);

      const { count: studentCount } = await supabase
        .from("user_courses")
        .select("*", { count: "exact", head: true })
        .eq("course_id", course.id);

      return { ...course, module_count: moduleCount ?? 0, student_count: studentCount ?? 0 } as CourseWithCounts;
    }),
  );

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1B3A7A] flex items-center gap-2">
            <Book className="h-5 w-5 sm:h-6 sm:w-6 text-[#F5A623]" />
            Gestión de Cursos
          </h1>
          <p className="text-sm text-[#666666] mt-0.5 sm:mt-1">
            {coursesWithCounts.length} curso{coursesWithCounts.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 sm:gap-3">
          <Link
            href="/admin/usuarios"
            className="border border-[#E0E0E0] text-[#212121] font-medium px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-1.5 sm:gap-2 text-sm"
          >
            <Users className="h-4 w-4" />
            Usuarios
          </Link>
          <Link
            href="/admin/cursos/nuevo"
            className="bg-[#F5A623] text-white font-semibold px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg hover:bg-[#e09515] transition-colors flex items-center gap-1.5 sm:gap-2 text-sm"
          >
            <PlusCircle className="h-4 w-4" />
            Nuevo curso
          </Link>
        </div>
      </div>

      {coursesWithCounts.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg border border-[#E0E0E0]">
          <Book className="h-16 w-16 text-[#E0E0E0] mx-auto mb-4" />
          <p className="text-[#666666] text-lg">No hay cursos creados.</p>
          <p className="text-[#666666] text-sm mt-1 mb-6">Creá tu primer curso para empezar.</p>
          <Link
            href="/admin/cursos/nuevo"
            className="bg-[#F5A623] text-white font-semibold px-4 py-2.5 rounded-lg hover:bg-[#e09515] transition-colors inline-flex items-center gap-2 text-sm"
          >
            <PlusCircle className="h-4 w-4" />
            Nuevo curso
          </Link>
        </div>
      ) : (
        <div className="space-y-2 sm:space-y-3">
          {coursesWithCounts.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-lg border border-[#E0E0E0] p-3 sm:p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                    <h3 className="font-semibold text-sm sm:text-base text-[#212121]">{course.title}</h3>
                    <span className="text-xs font-semibold text-[#1E6FBF] bg-[#1E6FBF]/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                      {PRODUCT_LABELS[course.product_key as ProductKey] ?? course.product_key}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${
                        course.published
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {course.published ? "Publicado" : "Borrador"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[#666666]">
                    <span>{course.module_count} módulos</span>
                    <span>{course.student_count} alumnos</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
                  {course.student_count > 0 && (
                    <Link
                      href={`/admin/cursos/${course.id}/alumnos`}
                      className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm text-[#1E6FBF] hover:underline font-medium whitespace-nowrap"
                    >
                      <GraduationCap className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      Ver alumnos
                    </Link>
                  )}
                  <DuplicateCourseButton courseId={course.id} />
                  <Link
                    href={`/admin/cursos/${course.id}`}
                    className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm text-[#1E6FBF] hover:underline font-medium whitespace-nowrap"
                  >
                    <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    Editar
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
