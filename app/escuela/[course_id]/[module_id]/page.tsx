"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, ArrowRight, CheckCircle, FileText, Download, HelpCircle, Mail, Square, CheckSquare as CheckSquareIcon } from "lucide-react";
import Link from "next/link";
import SupportModal from "@/components/SupportModal";
import type { Module, ModuleFile, ChecklistItem, FaqItem, ChecklistItemWithProgress } from "@/lib/types";

function getYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/,
  );
  return match ? match[1] : null;
}

export default function ModuleViewPage() {
  const { course_id, module_id } = useParams<{ course_id: string; module_id: string }>();
  const router = useRouter();
  const [mod, setMod] = useState<Module | null>(null);
  const [files, setFiles] = useState<ModuleFile[]>([]);
  const [completed, setCompleted] = useState(false);
  const [checklistItems, setChecklistItems] = useState<ChecklistItemWithProgress[]>([]);
  const [faqItems, setFaqItems] = useState<FaqItem[]>([]);
  const [openFaqs, setOpenFaqs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [markingChecklist, setMarkingChecklist] = useState<string | null>(null);
  const [showSupport, setShowSupport] = useState(false);
  const [nextId, setNextId] = useState<string | null>(null);
  const [prevId, setPrevId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: moduleData } = await supabase
        .from("modules").select("*").eq("id", module_id).single();
      if (!moduleData) { router.push(`/escuela/${course_id}`); return; }
      setMod(moduleData as Module);

      const { data: fileData } = await supabase
        .from("module_files").select("*").eq("module_id", module_id)
        .order("created_at", { ascending: true });
      setFiles((fileData as ModuleFile[]) ?? []);

      const { data: progressData } = await supabase
        .from("user_progress").select("completed")
        .eq("user_id", user.id).eq("module_id", module_id).single();
      setCompleted(progressData?.completed ?? false);

      const { data: allModules } = await supabase
        .from("modules").select("id, order_index")
        .eq("course_id", course_id).eq("published", true)
        .order("order_index", { ascending: true });

      if (allModules) {
        const idx = allModules.findIndex((m) => m.id === module_id);
        if (idx > 0) setPrevId(allModules[idx - 1].id);
        if (idx < allModules.length - 1) setNextId(allModules[idx + 1].id);
      }

      const { data: cl } = await supabase
        .from("module_checklist_items").select("*").eq("module_id", module_id)
        .order("order_index", { ascending: true });
      const checklistRaw = (cl as ChecklistItem[]) ?? [];

      const { data: cp } = await supabase
        .from("user_checklist_progress").select("checklist_item_id, completed")
        .eq("user_id", user.id);
      const progressMap = new Map((cp ?? []).map((p) => [p.checklist_item_id, p.completed]));

      setChecklistItems(
        checklistRaw.map((item) => ({
          ...item,
          completed: progressMap.get(item.id) ?? false,
        })),
      );

      const { data: fa } = await supabase
        .from("module_faq_items").select("*").eq("module_id", module_id)
        .order("order_index", { ascending: true });
      setFaqItems((fa as FaqItem[]) ?? []);

      setLoading(false);
    }
    load();
  }, [course_id, module_id, supabase, router]);

  const toggleChecklistItem = async (itemId: string, currentlyCompleted: boolean) => {
    setMarkingChecklist(itemId);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (currentlyCompleted) {
      await supabase.from("user_checklist_progress")
        .update({ completed: false, completed_at: null })
        .eq("user_id", user.id).eq("checklist_item_id", itemId);
    } else {
      await supabase.from("user_checklist_progress").upsert({
        user_id: user.id, checklist_item_id: itemId, completed: true,
        completed_at: new Date().toISOString(),
      }, { onConflict: "user_id,checklist_item_id" });
    }

    setChecklistItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, completed: !currentlyCompleted } : item,
      ),
    );
    setMarkingChecklist(null);
  };

  const toggleCompleted = async () => {
    setMarking(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (completed) {
      await supabase.from("user_progress")
        .update({ completed: false, completed_at: null })
        .eq("user_id", user.id).eq("module_id", module_id);
    } else {
      await supabase.from("user_progress").upsert({
        user_id: user.id, module_id, completed: true,
        completed_at: new Date().toISOString(),
      }, { onConflict: "user_id,module_id" });
    }
    setCompleted(!completed);
    setMarking(false);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse space-y-6">
        <div className="h-4 bg-gray-200 rounded w-1/4" />
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="aspect-video bg-gray-200 rounded-xl" />
      </div>
    );
  }

  if (!mod) return null;

  const videoId = mod.video_url ? getYouTubeId(mod.video_url) : null;

  const renderChecklist = () => (
    <div>
      <h2 className="text-xs sm:text-sm font-semibold text-[#666666] uppercase tracking-wider mb-3 flex items-center gap-2">
        <CheckSquareIcon className="h-4 w-4 text-[#1E6FBF]" />
        Checklist de tareas
      </h2>
      <div className="space-y-1.5">
        {checklistItems.map((item) => (
          <button
            key={item.id}
            onClick={() => toggleChecklistItem(item.id, item.completed)}
            disabled={markingChecklist === item.id}
            className={`w-full flex items-start gap-2 sm:gap-2.5 text-left px-3 py-2 rounded-lg border transition-colors ${
              item.completed
                ? "bg-green-50 border-green-200"
                : "bg-gray-50 border-[#E0E0E0] hover:bg-[#1E6FBF]/5 hover:border-[#1E6FBF]/30"
            } disabled:opacity-50`}
          >
            {item.completed ? (
              <CheckSquareIcon className="h-4 sm:h-5 w-4 sm:w-5 text-green-500 flex-shrink-0 mt-0.5" />
            ) : (
              <Square className="h-4 sm:h-5 w-4 sm:w-5 text-[#666666] flex-shrink-0 mt-0.5" />
            )}
            <span className={`text-sm ${item.completed ? "text-green-700 line-through" : "text-[#212121]"}`}>
              {item.text}
            </span>
          </button>
        ))}
      </div>
    </div>
  );

  const renderFaq = () => (
    <div>
      <h2 className="text-xs sm:text-sm font-semibold text-[#666666] uppercase tracking-wider mb-3 flex items-center gap-2">
        <HelpCircle className="h-4 w-4 text-[#1E6FBF]" />
        Preguntas frecuentes
      </h2>
      <div className="space-y-2">
        {faqItems.map((item) => (
          <details
            key={item.id}
            className="group bg-gray-50 rounded-lg border border-[#E0E0E0] [&[open]]:border-[#1E6FBF]/30"
            open={openFaqs.has(item.id)}
            onToggle={(e) => {
              const isOpen = (e.target as HTMLDetailsElement).open;
              setOpenFaqs((prev) => {
                const next = new Set(prev);
                if (isOpen) next.add(item.id);
                else next.delete(item.id);
                return next;
              });
            }}
          >
            <summary className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 cursor-pointer text-sm font-medium text-[#212121] list-none">
              <span className="pr-2">{item.question}</span>
              {openFaqs.has(item.id) ? (
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
              ) : (
                <HelpCircle className="h-4 w-4 text-[#1E6FBF] flex-shrink-0" />
              )}
            </summary>
            <div className="px-3 sm:px-4 pb-3">
              {item.answer && (
                <p className="text-sm text-[#666666] mb-2">{item.answer}</p>
              )}
              <button
                type="button"
                onClick={() => setShowSupport(true)}
                className="inline-flex items-center gap-1.5 text-xs text-[#1E6FBF] hover:underline font-medium"
              >
                <Mail className="h-3 w-3" />
                Consultar a soporte
              </button>
            </div>
          </details>
        ))}
      </div>
    </div>
  );

  const allChecklistCompleted = checklistItems.length === 0 ||
    checklistItems.every((item) => item.completed);

  const renderCompleteButton = () => (
    <div>
      {!allChecklistCompleted && (
        <p className="text-xs text-[#888888] text-center mb-2">
          Completá todas las tareas del checklist para poder marcar el módulo como terminado.
        </p>
      )}
      <button
        onClick={toggleCompleted}
        disabled={marking || !allChecklistCompleted}
        className={`w-full px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
          completed
            ? "bg-green-500 text-white hover:bg-green-600"
            : allChecklistCompleted
              ? "bg-[#F5A623] text-white hover:bg-[#e09515]"
              : "bg-[#F5A623]/50 text-white cursor-not-allowed"
        } disabled:opacity-50`}
      >
        <CheckCircle className="h-5 w-5" />
        {marking ? "Guardando..." : completed ? "Completado" : "Marcar como completado"}
      </button>
    </div>
  );

  const renderSupportCta = () => (
    <div className="bg-[#F5A623]/10 border border-[#F5A623]/30 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <HelpCircle className="h-5 w-5 text-[#F5A623] flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-[#212121] mb-2">
            ¿Estás trabado en este punto del proceso?
          </p>
          <p className="text-xs text-[#666666] mb-3">
            Escribile al equipo de soporte y te ayudan a destrabarlo.
          </p>
          <button
            type="button"
            onClick={() => setShowSupport(true)}
            className="inline-flex items-center gap-1.5 bg-[#F5A623] text-white font-semibold px-4 py-2 rounded-lg hover:bg-[#e09515] transition-colors text-sm"
          >
            <Mail className="h-4 w-4" />
            Escribir a soporte
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
      <Link
        href={`/escuela/${course_id}`}
        className="inline-flex items-center gap-1.5 text-sm text-[#1E6FBF] hover:underline mb-4 sm:mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al curso
      </Link>

      {/* MOBILE LAYOUT */}
      <div className="lg:hidden">
        <h1 className="text-xl font-bold text-[#1B3A7A] mb-3">{mod.title}</h1>

        {videoId && (
          <div className="relative aspect-video rounded-xl overflow-hidden bg-black shadow-lg mb-4">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              title={mod.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          </div>
        )}

        {mod.description && (
          <div className="mb-5">
            <div
              className="prose prose-sm max-w-none text-[#212121] [&_h1]:text-[#1B3A7A] [&_h2]:text-[#1B3A7A] [&_a]:text-[#1E6FBF] [&_p]:mb-3"
              dangerouslySetInnerHTML={{ __html: mod.description }}
            />
          </div>
        )}

        {checklistItems.length > 0 && <div className="mb-5">{renderChecklist()}</div>}

        {faqItems.length > 0 && <div className="mb-5">{renderFaq()}</div>}

        <div className="mb-5">{renderSupportCta()}</div>

        {files.length > 0 && (
          <div className="mb-5">
            <h2 className="text-xs sm:text-sm font-semibold text-[#666666] uppercase tracking-wider mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#1E6FBF]" />
              Material de apoyo
            </h2>
            <div className="space-y-2">
              {files.map((file) => (
                <a
                  key={file.id}
                  href={file.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-gray-50 border border-[#E0E0E0] rounded-lg px-4 py-3 hover:bg-[#1E6FBF]/5 hover:border-[#1E6FBF]/30 transition-colors group"
                >
                  <FileText className="h-5 w-5 text-[#1E6FBF] flex-shrink-0" />
                  <span className="text-sm text-[#212121] group-hover:text-[#1B3A7A] font-medium flex-1 truncate">
                    {file.name}
                  </span>
                  <Download className="h-4 w-4 text-[#666666] group-hover:text-[#1E6FBF] flex-shrink-0" />
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="mb-4">{renderCompleteButton()}</div>

        <div className="flex items-center justify-between pt-4 border-t border-[#E0E0E0]">
          {prevId ? (
            <Link
              href={`/escuela/${course_id}/${prevId}`}
              className="flex items-center gap-1.5 text-sm text-[#1E6FBF] hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              Anterior
            </Link>
          ) : <div />}
          {nextId && (
            <Link
              href={`/escuela/${course_id}/${nextId}`}
              className="flex items-center gap-1.5 text-sm text-[#1E6FBF] hover:underline"
            >
              Siguiente
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>

      {/* DESKTOP LAYOUT */}
      <div className="hidden lg:block">
        <div className="grid grid-cols-5 gap-6 xl:gap-8 mb-8">
          <div className="col-span-3">
            <h1 className="text-2xl font-bold text-[#1B3A7A] mb-4">{mod.title}</h1>

            {videoId && (
              <div className="relative aspect-video rounded-xl overflow-hidden bg-black shadow-lg">
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title={mod.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
              </div>
            )}

            {mod.description && (
              <div className="mt-5">
                <div
                  className="prose prose-sm max-w-none text-[#212121] [&_h1]:text-[#1B3A7A] [&_h2]:text-[#1B3A7A] [&_a]:text-[#1E6FBF] [&_p]:mb-3"
                  dangerouslySetInnerHTML={{ __html: mod.description }}
                />
              </div>
            )}

            {files.length > 0 && (
              <div className="mt-6">
                <h2 className="text-sm font-semibold text-[#666666] uppercase tracking-wider mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[#1E6FBF]" />
                  Material de apoyo
                </h2>
                <div className="space-y-2">
                  {files.map((file) => (
                    <a
                      key={file.id}
                      href={file.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 bg-gray-50 border border-[#E0E0E0] rounded-lg px-4 py-3 hover:bg-[#1E6FBF]/5 hover:border-[#1E6FBF]/30 transition-colors group"
                    >
                      <FileText className="h-5 w-5 text-[#1E6FBF] flex-shrink-0" />
                      <span className="text-sm text-[#212121] group-hover:text-[#1B3A7A] font-medium flex-1 truncate">
                        {file.name}
                      </span>
                      <Download className="h-4 w-4 text-[#666666] group-hover:text-[#1E6FBF] flex-shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6">{renderSupportCta()}</div>
          </div>

          <div className="col-span-2 flex flex-col">
            {checklistItems.length > 0 && <div className="mb-6">{renderChecklist()}</div>}
            {faqItems.length > 0 && <div className="mb-6">{renderFaq()}</div>}
            <div className="mt-auto">{renderCompleteButton()}</div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-[#E0E0E0]">
          {prevId ? (
            <Link
              href={`/escuela/${course_id}/${prevId}`}
              className="flex items-center gap-1.5 text-sm text-[#1E6FBF] hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              Módulo anterior
            </Link>
          ) : <div />}
          {nextId && (
            <Link
              href={`/escuela/${course_id}/${nextId}`}
              className="flex items-center gap-1.5 text-sm text-[#1E6FBF] hover:underline"
            >
              Siguiente módulo
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>

      {showSupport && (
        <SupportModal
          moduleTitle={mod.title}
          onClose={() => setShowSupport(false)}
        />
      )}
    </div>
  );
}
