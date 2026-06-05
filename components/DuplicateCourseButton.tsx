"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Loader2 } from "lucide-react";

export default function DuplicateCourseButton({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDuplicate = async () => {
    if (!confirm("¿Duplicar este curso con todos sus módulos?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/duplicate`, { method: "POST" });
      const data = await res.json();
      if (data.id) {
        router.push(`/admin/cursos/${data.id}`);
      }
    } catch {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader2 className="h-4 w-4 animate-spin text-[#666666]" />;
  }

  return (
    <button
      onClick={handleDuplicate}
      className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm text-[#666666] hover:text-[#F5A623] font-medium whitespace-nowrap transition-colors"
      title="Duplicar curso"
    >
      <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      Duplicar
    </button>
  );
}
