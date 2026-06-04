"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { moduleSchema } from "@/lib/schemas";
import TipTapEditor from "@/components/TipTapEditor";
import FileUpload from "@/components/FileUpload";

export default function NuevoModuloPage() {
  const { id: courseId } = useParams<{ id: string }>();
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const { register, handleSubmit, control, formState: { errors } } = useForm({
    resolver: zodResolver(moduleSchema),
    defaultValues: { title: "", description: "", video_url: "", published: false },
  });

  const onSubmit = async (data: any) => {
    setSaving(true);
    setError("");

    const { data: maxIndex } = await supabase
      .from("modules")
      .select("order_index")
      .eq("course_id", courseId)
      .order("order_index", { ascending: false })
      .limit(1)
      .single();

    const newOrderIndex = (maxIndex?.order_index ?? -1) + 1;

    const { error: insertError } = await supabase.from("modules").insert({
      ...data,
      course_id: courseId,
      order_index: newOrderIndex,
    });

    if (insertError) { setError(insertError.message); setSaving(false); return; }
    router.push(`/admin/cursos/${courseId}`);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link
        href={`/admin/cursos/${courseId}`}
        className="inline-flex items-center gap-1.5 text-sm text-[#1E6FBF] hover:underline mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al curso
      </Link>

      <h1 className="text-2xl font-bold text-[#1B3A7A] mb-8">Nuevo módulo</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-6 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl border border-[#E0E0E0] p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-[#212121] mb-1">Título del módulo</label>
          <input
            type="text"
            {...register("title")}
            className="w-full px-3 py-2.5 border border-[#E0E0E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E6FBF] focus:border-transparent"
            placeholder="Ej: Primeros pasos"
          />
          {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message as string}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-[#212121] mb-1">URL del video (YouTube)</label>
          <input
            type="text"
            {...register("video_url")}
            className="w-full px-3 py-2.5 border border-[#E0E0E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E6FBF] focus:border-transparent"
            placeholder="https://www.youtube.com/watch?v=..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#212121] mb-1">Descripción</label>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <TipTapEditor content={field.value ?? ""} onChange={field.onChange} />
            )}
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" {...register("published")} className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#1E6FBF] rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#F5A623]" />
          </label>
          <span className="text-sm font-medium text-[#212121]">Publicar al guardar</span>
        </div>

        <div className="flex items-center justify-end gap-2 sm:gap-3 pt-4 border-t border-[#E0E0E0]">
          <Link
            href={`/admin/cursos/${courseId}`}
            className="px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-[#666666] hover:text-[#212121]"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="bg-[#F5A623] text-white font-semibold px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg hover:bg-[#e09515] transition-colors disabled:opacity-50 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm"
          >
            <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            {saving ? "Guardando..." : "Guardar módulo"}
          </button>
        </div>
      </form>
    </div>
  );
}
