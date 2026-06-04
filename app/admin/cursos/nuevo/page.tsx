"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { courseSchema } from "@/lib/schemas";
import { PRODUCT_LABELS, type ProductKey } from "@/lib/types";

export default function NuevoCursoPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: "",
      product_key: "libreria" as ProductKey,
      description: "",
      order_index: 0,
      published: false,
    },
  });

  const onSubmit = async (data: any) => {
    setSaving(true);
    setError("");

    const { data: maxIndex } = await supabase
      .from("courses")
      .select("order_index")
      .order("order_index", { ascending: false })
      .limit(1)
      .single();

    const newOrderIndex = (maxIndex?.order_index ?? -1) + 1;

    const { error: insertError } = await supabase.from("courses").insert({
      ...data,
      order_index: newOrderIndex,
    });

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    router.push("/admin");
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-sm text-[#1E6FBF] hover:underline mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al panel
      </Link>

      <h1 className="text-2xl font-bold text-[#1B3A7A] mb-8">Nuevo curso</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-6 text-sm">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white rounded-xl border border-[#E0E0E0] p-6 space-y-5"
      >
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-[#212121] mb-1">
            Título del curso
          </label>
          <input
            id="title"
            type="text"
            {...register("title")}
            className="w-full px-3 py-2.5 border border-[#E0E0E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E6FBF] focus:border-transparent"
            placeholder="Ej: Introducción a Fierro"
          />
          {errors.title && (
            <p className="text-red-500 text-xs mt-1">{errors.title.message as string}</p>
          )}
        </div>

        <div>
          <label htmlFor="product_key" className="block text-sm font-medium text-[#212121] mb-1">
            Producto
          </label>
          <select
            id="product_key"
            {...register("product_key")}
            className="w-full px-3 py-2.5 border border-[#E0E0E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E6FBF] focus:border-transparent bg-white"
          >
            {(Object.entries(PRODUCT_LABELS) as [ProductKey, string][]).map(
              ([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ),
            )}
          </select>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-[#212121] mb-1">
            Descripción
          </label>
          <textarea
            id="description"
            {...register("description")}
            rows={4}
            className="w-full px-3 py-2.5 border border-[#E0E0E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E6FBF] focus:border-transparent resize-none"
            placeholder="Descripción del curso..."
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" {...register("published")} className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#1E6FBF] rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#F5A623]" />
          </label>
          <span className="text-sm font-medium text-[#212121]">Publicar al guardar</span>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E0E0E0]">
          <Link
            href="/admin"
            className="px-4 py-2.5 text-sm font-medium text-[#666666] hover:text-[#212121] transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="bg-[#F5A623] text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-[#e09515] transition-colors disabled:opacity-50 flex items-center gap-2 text-sm"
          >
            <Save className="h-4 w-4" />
            {saving ? "Guardando..." : "Guardar curso"}
          </button>
        </div>
      </form>
    </div>
  );
}
