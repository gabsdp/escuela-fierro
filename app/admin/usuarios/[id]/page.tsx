"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, User, Book, Save, X, Pencil } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { PRODUCT_LABELS, type ProductKey } from "@/lib/types";
import type { Profile, Course } from "@/lib/types";

interface CourseWithCompletion extends Course {
  total_modules: number;
  completed_modules: number;
}

export default function AdminUsuarioPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [assignedIds, setAssignedIds] = useState<Set<string>>(new Set());
  const [coursesWithProgress, setCoursesWithProgress] = useState<CourseWithCompletion[]>([]);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editError, setEditError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: p } = await supabase.from("profiles").select("*").eq("id", id).single();
      if (!p) { router.push("/admin/usuarios"); return; }
      setProfile(p as Profile);

      const { data: courses } = await supabase
        .from("courses").select("*").order("order_index", { ascending: true });
      setAllCourses((courses as Course[]) ?? []);

      const { data: assignments } = await supabase
        .from("user_courses").select("course_id").eq("user_id", id);
      const assigned = new Set<string>((assignments ?? []).map((a) => a.course_id));
      setAssignedIds(assigned);

      const progress = await Promise.all(
        (courses ?? []).map(async (course) => {
          const { data: moduleIds } = await supabase
            .from("modules").select("id").eq("course_id", course.id).eq("published", true);
          const totalModules = moduleIds?.length ?? 0;
          let completedModules = 0;
          if (moduleIds && moduleIds.length > 0) {
            const ids = moduleIds.map((m) => m.id);
            const { count } = await supabase
              .from("user_progress")
              .select("*", { count: "exact", head: true })
              .eq("user_id", id).in("module_id", ids).eq("completed", true);
            completedModules = count ?? 0;
          }
          return { ...course, total_modules: totalModules, completed_modules: completedModules };
        }),
      );

      setCoursesWithProgress(progress);
      setLoading(false);
    }
    load();
  }, [id, supabase, router]);

  const handleStartEdit = () => {
    if (!profile) return;
    setEditName(profile.full_name);
    setEditEmail(profile.email);
    setEditing(true);
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    setEditError("");

    try {
      const res = await fetch("/api/admin/update-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: profile.id, full_name: editName, email: editEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        setEditError(data.error || "Error al guardar");
      } else {
        setProfile({ ...profile, full_name: editName, email: editEmail });
        setEditing(false);
      }
    } catch {
      setEditError("Error de conexión al guardar");
    }

    setSaving(false);
  };

  const toggleCourse = async (courseId: string) => {
    if (assignedIds.has(courseId)) {
      await supabase.from("user_courses").delete().eq("user_id", id).eq("course_id", courseId);
      setAssignedIds((prev) => { const next = new Set(prev); next.delete(courseId); return next; });
    } else {
      await supabase.from("user_courses").insert({
        user_id: id,
        course_id: courseId,
        assigned_by: (await supabase.auth.getUser()).data.user?.id,
      });
      setAssignedIds((prev) => new Set(prev).add(courseId));
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse space-y-6">
        <div className="h-4 bg-gray-200 rounded w-1/4" />
        <div className="h-8 bg-gray-200 rounded w-1/3" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link
        href="/admin/usuarios"
        className="inline-flex items-center gap-1.5 text-sm text-[#1E6FBF] hover:underline mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a usuarios
      </Link>

      <div className="bg-white rounded-xl border border-[#E0E0E0] p-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#1B3A7A]/10 flex items-center justify-center">
            <User className="h-7 w-7 text-[#1B3A7A]" />
          </div>
          {editing ? (
            <div className="flex-1 space-y-3">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 border border-[#E0E0E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E6FBF] text-sm"
                placeholder="Nombre completo"
              />
              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="w-full px-3 py-2 border border-[#E0E0E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E6FBF] text-sm"
                placeholder="Email"
              />
              {editError && (
                <p className="text-red-500 text-xs">{editError}</p>
              )}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving || !editName || !editEmail}
                  className="bg-[#F5A623] text-white px-3 py-1.5 rounded-lg hover:bg-[#e09515] disabled:opacity-50 text-sm font-medium flex items-center gap-1"
                >
                  <Save className="h-3.5 w-3.5" />
                  {saving ? "Guardando..." : "Guardar"}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="text-[#666666] hover:text-[#212121] text-sm flex items-center gap-1"
                >
                  <X className="h-3.5 w-3.5" />
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <>
              <div>
                <h1 className="text-xl font-bold text-[#1B3A7A]">
                  {profile.full_name || "Sin nombre"}
                </h1>
                <p className="text-[#666666]">{profile.email}</p>
              </div>
              <button
                onClick={handleStartEdit}
                className="ml-auto text-[#666666] hover:text-[#1B3A7A] transition-colors"
                title="Editar datos"
              >
                <Pencil className="h-5 w-5" />
              </button>
            </>
          )}
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              profile.role === "admin"
                ? "bg-purple-100 text-purple-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {profile.role}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl border border-[#E0E0E0] p-6">
          <h2 className="text-lg font-semibold text-[#212121] mb-4 flex items-center gap-2">
            <Book className="h-5 w-5 text-[#F5A623]" />
            Asignar cursos
          </h2>
          <div className="space-y-2">
            {allCourses.map((course) => (
              <label
                key={course.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 cursor-pointer border border-[#E0E0E0]"
              >
                <input
                  type="checkbox"
                  checked={assignedIds.has(course.id)}
                  onChange={() => toggleCourse(course.id)}
                  className="w-4 h-4 text-[#F5A623] rounded focus:ring-[#F5A623]"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#212121]">{course.title}</p>
                  <p className="text-xs text-[#666666]">
                    {PRODUCT_LABELS[course.product_key as ProductKey] ?? course.product_key}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E0E0E0] p-6">
          <h2 className="text-lg font-semibold text-[#212121] mb-4">Progreso</h2>
          {coursesWithProgress.length === 0 ? (
            <p className="text-[#666666] text-sm">No hay cursos disponibles.</p>
          ) : (
            <div className="space-y-4">
              {coursesWithProgress.map((course) => (
                <div key={course.id}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-[#212121]">{course.title}</p>
                    <span className="text-xs text-[#666666]">
                      {course.completed_modules}/{course.total_modules}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-500"
                      style={{
                        width: course.total_modules > 0
                          ? `${(course.completed_modules / course.total_modules) * 100}%`
                          : "0%",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
