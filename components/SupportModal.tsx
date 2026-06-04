"use client";

import { useState, useEffect, useRef } from "react";
import { X, Loader2, Send, CheckCircle, AlertCircle, Paperclip } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface SupportModalProps {
  moduleTitle: string;
  onClose: () => void;
}

interface Attachment {
  name: string;
  url: string;
}

export default function SupportModal({ moduleTitle, onClose }: SupportModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setName(user.user_metadata?.full_name || "");
      setEmail(user.email || "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();
      if (profile?.full_name) setName(profile.full_name);
    }
    loadProfile();
  }, [supabase]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingFiles(true);
    const newAttachments: Attachment[] = [];

    for (const file of Array.from(files)) {
      const fileExt = file.name.split(".").pop();
      const fileName = `support/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("attachments")
        .upload(fileName, file);

      if (uploadError) continue;

      const { data: urlData } = supabase.storage
        .from("attachments")
        .getPublicUrl(fileName);

      newAttachments.push({ name: file.name, url: urlData.publicUrl });
    }

    setAttachments((prev) => [...prev, ...newAttachments]);
    setUploadingFiles(false);
    e.target.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, email, subject, message: message.trim(), moduleTitle,
          attachments: attachments.map((a) => ({ name: a.name, url: a.url })),
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Error al enviar");
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al enviar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E0E0E0]">
          <h2 className="text-lg font-bold text-[#1B3A7A]">Contactar a soporte</h2>
          <button onClick={onClose} className="text-[#666666] hover:text-[#212121] transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {success ? (
          <div className="p-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <p className="text-sm text-[#212121] font-medium">¡Consulta enviada!</p>
            <p className="text-xs text-[#666666] mt-1">El equipo de soporte te va a responder pronto.</p>
            <button
              onClick={onClose}
              className="mt-4 bg-[#1B3A7A] text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-[#162e63] transition-colors text-sm"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#212121] mb-1">Nombre y apellido</label>
              <input
                type="text"
                value={name}
                readOnly
                className="w-full px-3 py-2.5 border border-[#E0E0E0] rounded-lg bg-gray-100 text-[#666666] text-sm cursor-default"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#212121] mb-1">Email</label>
              <input
                type="email"
                value={email}
                readOnly
                className="w-full px-3 py-2.5 border border-[#E0E0E0] rounded-lg bg-gray-100 text-[#666666] text-sm cursor-default"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#212121] mb-1">Asunto</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ej: Problema con la importación de catálogo"
                className="w-full px-3 py-2.5 border border-[#E0E0E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E6FBF] focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#212121] mb-1">
                ¿En qué te podemos ayudar?
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={4}
                placeholder="Describí tu consulta o problema..."
                className="w-full px-3 py-2.5 border border-[#E0E0E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E6FBF] focus:border-transparent text-sm resize-none"
              />
            </div>

            <div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingFiles}
                className="inline-flex items-center gap-1.5 text-sm text-[#1E6FBF] hover:underline font-medium disabled:opacity-50"
              >
                <Paperclip className="h-4 w-4" />
                {uploadingFiles ? "Subiendo..." : "Adjuntar archivos"}
              </button>
              <p className="text-xs text-[#888888] mt-1">
                Te recomendamos que nos envíes una captura de pantalla del error que estás reportando si corresponde.
              </p>

              {attachments.length > 0 && (
                <div className="mt-2 space-y-1">
                  {attachments.map((att, i) => (
                    <div key={i} className="flex items-center justify-between bg-gray-50 rounded px-3 py-1.5 border border-[#E0E0E0] text-sm">
                      <span className="text-[#212121] truncate flex-1">{att.name}</span>
                      <button
                        type="button"
                        onClick={() => setAttachments((prev) => prev.filter((_, j) => j !== i))}
                        className="text-[#666666] hover:text-red-500 ml-2 flex-shrink-0"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !name || !email || !message.trim()}
              className="w-full bg-[#F5A623] text-white font-semibold px-6 py-3 rounded-lg hover:bg-[#e09515] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Enviar consulta
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
