"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, Trash2, Plus, HelpCircle, CheckSquare, Mail, X } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { moduleSchema } from "@/lib/schemas";
import TipTapEditor from "@/components/TipTapEditor";
import FileUpload from "@/components/FileUpload";
import type { ModuleFile, ChecklistItem, FaqItem } from "@/lib/types";

export default function EditModuloPage() {
  const { id: courseId, module_id } = useParams<{ id: string; module_id: string }>();
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<ModuleFile[]>([]);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [faqItems, setFaqItems] = useState<FaqItem[]>([]);
  const [newChecklistText, setNewChecklistText] = useState("");
  const [newFaqQuestion, setNewFaqQuestion] = useState("");
  const [newFaqAnswer, setNewFaqAnswer] = useState("");
  const [addingChecklist, setAddingChecklist] = useState(false);
  const [addingFaq, setAddingFaq] = useState(false);
  const supabase = createClient();

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm({
    resolver: zodResolver(moduleSchema),
  });

  useEffect(() => {
    async function load() {
      const { data: mod } = await supabase
        .from("modules").select("*").eq("id", module_id).single();
      if (!mod) { router.push(`/admin/cursos/${courseId}`); return; }

      reset({
        title: mod.title,
        description: mod.description || "",
        video_url: mod.video_url || "",
        published: mod.published,
      });

      const { data: f } = await supabase
        .from("module_files").select("*").eq("module_id", module_id)
        .order("created_at", { ascending: true });
      setFiles((f as ModuleFile[]) ?? []);

      const { data: cl } = await supabase
        .from("module_checklist_items").select("*").eq("module_id", module_id)
        .order("order_index", { ascending: true });
      setChecklistItems((cl as ChecklistItem[]) ?? []);

      const { data: fa } = await supabase
        .from("module_faq_items").select("*").eq("module_id", module_id)
        .order("order_index", { ascending: true });
      setFaqItems((fa as FaqItem[]) ?? []);

      setLoading(false);
    }
    load();
  }, [courseId, module_id, supabase, reset, router]);

  const onSubmit = async (data: any) => {
    setSaving(true);
    setError("");
    const { error: updateError } = await supabase
      .from("modules").update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", module_id);
    if (updateError) { setError(updateError.message); setSaving(false); return; }
    router.push(`/admin/cursos/${courseId}`);
  };

  const handleDelete = async () => {
    if (!confirm("¿Eliminar este módulo?")) return;
    await supabase.from("module_files").delete().eq("module_id", module_id);
    await supabase.from("user_progress").delete().eq("module_id", module_id);
    await supabase.from("modules").delete().eq("id", module_id);
    router.push(`/admin/cursos/${courseId}`);
  };

  const handleAddChecklistItem = async () => {
    if (!newChecklistText.trim()) return;
    setAddingChecklist(true);
    const maxOrder = checklistItems.reduce((max, item) => Math.max(max, item.order_index), -1);
    const { data: inserted, error } = await supabase
      .from("module_checklist_items")
      .insert({ module_id, text: newChecklistText.trim(), order_index: maxOrder + 1 })
      .select()
      .single();
    if (!error && inserted) {
      setChecklistItems((prev) => [...prev, inserted as ChecklistItem]);
      setNewChecklistText("");
    }
    setAddingChecklist(false);
  };

  const handleDeleteChecklistItem = async (itemId: string) => {
    await supabase.from("module_checklist_items").delete().eq("id", itemId);
    setChecklistItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleAddFaqItem = async () => {
    if (!newFaqQuestion.trim()) return;
    setAddingFaq(true);
    const maxOrder = faqItems.reduce((max, item) => Math.max(max, item.order_index), -1);
    const { data: inserted, error } = await supabase
      .from("module_faq_items")
      .insert({ module_id, question: newFaqQuestion.trim(), answer: newFaqAnswer.trim(), order_index: maxOrder + 1 })
      .select()
      .single();
    if (!error && inserted) {
      setFaqItems((prev) => [...prev, inserted as FaqItem]);
      setNewFaqQuestion("");
      setNewFaqAnswer("");
    }
    setAddingFaq(false);
  };

  const handleDeleteFaqItem = async (itemId: string) => {
    await supabase.from("module_faq_items").delete().eq("id", itemId);
    setFaqItems((prev) => prev.filter((item) => item.id !== itemId));
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
        href={`/admin/cursos/${courseId}`}
        className="inline-flex items-center gap-1.5 text-sm text-[#1E6FBF] hover:underline mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al curso
      </Link>

      <h1 className="text-2xl font-bold text-[#1B3A7A] mb-8">Editar módulo</h1>

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
          />
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
          <span className="text-sm font-medium text-[#212121]">Publicado</span>
        </div>

        <FileUpload
          moduleId={module_id}
          existingFiles={files}
          onUploadComplete={(att) => setFiles((prev) => [...prev, att])}
          onDelete={(fileId) => setFiles((prev) => prev.filter((a) => a.id !== fileId))}
        />

        {/* Checklist section */}
        <div className="pt-4 border-t border-[#E0E0E0]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-[#212121] flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-[#1E6FBF]" />
              Checklist de tareas
            </h2>
          </div>

          <div className="space-y-2 mb-3">
            {checklistItems.length === 0 ? (
              <p className="text-sm text-[#666666] italic">Sin tareas aún.</p>
            ) : (
              checklistItems.map((item) => (
                <div key={item.id} className="flex items-center gap-2 bg-gray-50 rounded-lg border border-[#E0E0E0] px-3 py-2">
                  <span className="text-sm text-[#212121] flex-1">{item.text}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteChecklistItem(item.id)}
                    className="text-[#666666] hover:text-red-500 transition-colors flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newChecklistText}
              onChange={(e) => setNewChecklistText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddChecklistItem(); } }}
              placeholder="Ej: Verifiqué que el catálogo está cargado"
              className="flex-1 px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E6FBF] focus:border-transparent"
            />
            <button
              type="button"
              onClick={handleAddChecklistItem}
              disabled={addingChecklist || !newChecklistText.trim()}
              className="bg-[#1E6FBF] text-white px-3 py-2 rounded-lg hover:bg-[#195a9e] transition-colors disabled:opacity-50 text-sm font-medium flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              Agregar
            </button>
          </div>
        </div>

        {/* FAQ section */}
        <div className="pt-4 border-t border-[#E0E0E0]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-[#212121] flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-[#1E6FBF]" />
              Preguntas frecuentes
            </h2>
          </div>

          <div className="space-y-3 mb-3">
            {faqItems.length === 0 ? (
              <p className="text-sm text-[#666666] italic">Sin preguntas aún.</p>
            ) : (
              faqItems.map((item) => (
                <div key={item.id} className="bg-gray-50 rounded-lg border border-[#E0E0E0] p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-[#212121] flex-1">{item.question}</p>
                    <button
                      type="button"
                      onClick={() => handleDeleteFaqItem(item.id)}
                      className="text-[#666666] hover:text-red-500 transition-colors flex-shrink-0 mt-0.5"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  {item.answer && (
                    <p className="text-sm text-[#666666] mt-1">{item.answer}</p>
                  )}
                  <div className="mt-2">
                    <a
                      href="mailto:soporte@fierro.com.ar"
                      className="inline-flex items-center gap-1.5 text-xs text-[#1E6FBF] hover:underline font-medium"
                    >
                      <Mail className="h-3 w-3" />
                      Consultar a soporte
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="space-y-2 bg-gray-50 rounded-lg border border-dashed border-[#E0E0E0] p-3">
            <input
              type="text"
              value={newFaqQuestion}
              onChange={(e) => setNewFaqQuestion(e.target.value)}
              placeholder="Pregunta"
              className="w-full px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E6FBF] focus:border-transparent"
            />
            <input
              type="text"
              value={newFaqAnswer}
              onChange={(e) => setNewFaqAnswer(e.target.value)}
              placeholder="Respuesta (opcional)"
              className="w-full px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E6FBF] focus:border-transparent"
            />
            <button
              type="button"
              onClick={handleAddFaqItem}
              disabled={addingFaq || !newFaqQuestion.trim()}
              className="bg-[#1E6FBF] text-white px-3 py-2 rounded-lg hover:bg-[#195a9e] transition-colors disabled:opacity-50 text-sm font-medium flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              Agregar pregunta
            </button>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 sm:gap-3 pt-4 border-t border-[#E0E0E0]">
          <div className="flex items-center gap-2 sm:gap-3">
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
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
          <button
            type="button"
            onClick={handleDelete}
            className="text-red-500 hover:text-red-600 font-medium text-xs sm:text-sm flex items-center gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Eliminar módulo
          </button>
        </div>
      </form>
    </div>
  );
}
