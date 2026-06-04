"use client";

import { useState, useCallback } from "react";
import { Upload, X, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { ModuleFile } from "@/lib/types";

interface FileUploadProps {
  moduleId?: string;
  existingFiles?: ModuleFile[];
  onUploadComplete?: (attachment: ModuleFile) => void;
  onDelete?: (id: string) => void;
}

export default function FileUpload({
  moduleId,
  existingFiles = [],
  onUploadComplete,
  onDelete,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const supabase = createClient();

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || !moduleId) return;

      setUploading(true);

      for (const file of Array.from(files)) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `modules/${moduleId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("attachments")
          .upload(filePath, file);

        if (uploadError) continue;

        const { data: urlData } = supabase.storage
          .from("attachments")
          .getPublicUrl(filePath);

        const { data: attachment } = await supabase
          .from("module_files")
          .insert({
            module_id: moduleId,
            name: file.name,
            file_url: urlData.publicUrl,
          })
          .select()
          .single();

        if (attachment) {
          onUploadComplete?.(attachment as ModuleFile);
        }
      }

      setUploading(false);
      e.target.value = "";
    },
    [moduleId, supabase, onUploadComplete],
  );

  const handleDelete = async (attachment: ModuleFile) => {
    const filePath = attachment.file_url.split("/").pop();
    if (filePath) {
      await supabase.storage
        .from("attachments")
        .remove([`modules/${attachment.module_id}/${filePath}`]);
    }

    await supabase.from("module_files").delete().eq("id", attachment.id);
    onDelete?.(attachment.id);
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-[#212121] mb-2">
          Archivos adjuntos
        </label>
        <label
          className={`flex items-center justify-center gap-2 border-2 border-dashed border-[#E0E0E0] rounded-lg px-4 py-6 cursor-pointer hover:border-[#1E6FBF] hover:bg-[#1E6FBF]/5 transition-colors ${
            uploading ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          <Upload className="h-5 w-5 text-[#666666]" />
          <span className="text-sm text-[#666666]">
            {uploading ? "Subiendo..." : "Click para subir archivos"}
          </span>
          <input
            type="file"
            multiple
            onChange={handleUpload}
            className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
          />
        </label>
        {!moduleId && (
          <p className="text-xs text-[#666666] mt-1">
            Guardá el módulo primero para poder subir archivos.
          </p>
        )}
      </div>

      {existingFiles.length > 0 && (
        <ul className="space-y-1.5">
          {existingFiles.map((file) => (
            <li
              key={file.id}
              className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 border border-[#E0E0E0]"
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="h-4 w-4 text-[#1E6FBF] flex-shrink-0" />
                <a
                  href={file.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#1E6FBF] hover:underline truncate"
                >
                  {file.name}
                </a>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(file)}
                className="text-[#666666] hover:text-red-500 transition-colors flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
