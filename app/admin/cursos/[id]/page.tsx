"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { ArrowLeft, Save, Trash2, PlusCircle, Eye, EyeOff, Edit, GripVertical, Play } from "lucide-react";
import Link from "next/link";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { createClient } from "@/lib/supabase/client";
import { courseSchema } from "@/lib/schemas";
import { PRODUCT_LABELS, type ProductKey } from "@/lib/types";
import type { Module } from "@/lib/types";

function SortableModuleItem({
  mod,
  courseId,
  onTogglePublish,
  onDelete,
}: {
  mod: Module;
  courseId: string;
  onTogglePublish: (id: string, published: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: mod.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 bg-gray-50 rounded-lg border border-[#E0E0E0] p-3 hover:shadow-sm transition-shadow ${
        isDragging ? "shadow-lg z-50" : ""
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="text-[#666666] hover:text-[#1B3A7A] cursor-grab active:cursor-grabbing flex-shrink-0"
      >
        <GripVertical className="h-5 w-5" />
      </button>

      <div className="flex items-center gap-2 min-w-0 flex-1">
        <Play className="h-4 w-4 text-[#1B3A7A] flex-shrink-0" />
        <span className="font-medium text-[#212121] truncate">{mod.title}</span>
      </div>

      <span
        className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
          mod.published ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
        }`}
      >
        {mod.published ? "Publicado" : "Borrador"}
      </span>

      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => onTogglePublish(mod.id, !mod.published)}
          title={mod.published ? "Despublicar" : "Publicar"}
          className="p-1.5 rounded hover:bg-gray-200 text-[#666666] hover:text-[#1B3A7A] transition-colors"
        >
          {mod.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
        <Link
          href={`/admin/cursos/${courseId}/modulos/${mod.id}`}
          className="p-1.5 rounded hover:bg-gray-200 text-[#666666] hover:text-[#1E6FBF] transition-colors"
        >
          <Edit className="h-4 w-4" />
        </Link>
        <button
          onClick={() => onDelete(mod.id)}
          className="p-1.5 rounded hover:bg-red-50 text-[#666666] hover:text-red-500 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function EditCursoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modules, setModules] = useState<Module[]>([]);
  const supabase = createClient();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(courseSchema),
  });

  useEffect(() => {
    async function load() {
      const { data: course } = await supabase
        .from("courses").select("*").eq("id", id).single();
      if (!course) { router.push("/admin"); return; }

      reset({
        title: course.title,
        product_key: course.product_key as ProductKey,
        description: course.description || "",
        order_index: course.order_index,
        published: course.published,
      });

      const { data: mods } = await supabase
        .from("modules").select("*").eq("course_id", id)
        .order("order_index", { ascending: true });
      setModules((mods as Module[]) ?? []);

      setLoading(false);
    }
    load();
  }, [id, supabase, reset, router]);

  const onSubmit = async (data: any) => {
    setSaving(true);
    setError("");
    const { error: updateError } = await supabase
      .from("courses").update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (updateError) { setError(updateError.message); setSaving(false); return; }
    router.push("/admin");
  };

  const handleDeleteCourse = async () => {
    if (!confirm("¿Eliminar este curso y todos sus módulos?")) return;
    await supabase.from("modules").delete().eq("course_id", id);
    await supabase.from("user_courses").delete().eq("course_id", id);
    await supabase.from("courses").delete().eq("id", id);
    router.push("/admin");
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setModules((items) => {
      const oldIndex = items.findIndex((m) => m.id === active.id);
      const newIndex = items.findIndex((m) => m.id === over.id);
      const reordered = arrayMove(items, oldIndex, newIndex);
      reordered.forEach(async (mod, index) => {
        await supabase.from("modules").update({ order_index: index }).eq("id", mod.id);
      });
      return reordered;
    });
  };

  const handleTogglePublish = async (moduleId: string, published: boolean) => {
    await supabase.from("modules").update({ published }).eq("id", moduleId);
    setModules((prev) => prev.map((m) => (m.id === moduleId ? { ...m, published } : m)));
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm("¿Eliminar este módulo?")) return;
    await supabase.from("module_files").delete().eq("module_id", moduleId);
    await supabase.from("user_progress").delete().eq("module_id", moduleId);
    await supabase.from("modules").delete().eq("id", moduleId);
    setModules((prev) => prev.filter((m) => m.id !== moduleId));
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 animate-pulse space-y-6">
        <div className="h-4 bg-gray-200 rounded w-1/4" />
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="h-10 bg-gray-200 rounded" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-sm text-[#1E6FBF] hover:underline mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al panel
      </Link>

      <h1 className="text-2xl font-bold text-[#1B3A7A] mb-8">Editar curso</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-6 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl border border-[#E0E0E0] p-6 space-y-5 mb-8">
        <div>
          <label className="block text-sm font-medium text-[#212121] mb-1">Título</label>
          <input
            type="text"
            {...register("title")}
            className="w-full px-3 py-2.5 border border-[#E0E0E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E6FBF] focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#212121] mb-1">Producto</label>
          <select
            {...register("product_key")}
            className="w-full px-3 py-2.5 border border-[#E0E0E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E6FBF] focus:border-transparent bg-white"
          >
            {(Object.entries(PRODUCT_LABELS) as [ProductKey, string][]).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#212121] mb-1">Descripción</label>
          <textarea
            {...register("description")}
            rows={3}
            className="w-full px-3 py-2.5 border border-[#E0E0E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E6FBF] focus:border-transparent resize-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" {...register("published")} className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#1E6FBF] rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#F5A623]" />
          </label>
          <span className="text-sm font-medium text-[#212121]">Publicado</span>
        </div>

        <div className="flex flex-col items-end gap-2 sm:gap-3 pt-4 border-t border-[#E0E0E0]">
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/admin" className="px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-[#666666] hover:text-[#212121]">
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="bg-[#F5A623] text-white font-semibold px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg hover:bg-[#e09515] transition-colors disabled:opacity-50 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm"
            >
              <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
          <button
            type="button"
            onClick={handleDeleteCourse}
            className="text-red-500 hover:text-red-600 font-medium text-xs sm:text-sm flex items-center gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Eliminar curso
          </button>
        </div>
      </form>

      {/* Modules section */}
      <div className="bg-white rounded-xl border border-[#E0E0E0] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#212121]">
            Módulos ({modules.length})
          </h2>
          <Link
            href={`/admin/cursos/${id}/modulos/nuevo`}
            className="bg-[#F5A623] text-white font-semibold px-3 py-2 rounded-lg hover:bg-[#e09515] transition-colors flex items-center gap-2 text-sm"
          >
            <PlusCircle className="h-4 w-4" />
            Nuevo módulo
          </Link>
        </div>

        {modules.length === 0 ? (
          <p className="text-[#666666] text-sm text-center py-8">
            No hay módulos en este curso todavía.
          </p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={modules.map((m) => m.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {modules.map((mod) => (
                  <SortableModuleItem
                    key={mod.id}
                    mod={mod}
                    courseId={id}
                    onTogglePublish={handleTogglePublish}
                    onDelete={handleDeleteModule}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}
