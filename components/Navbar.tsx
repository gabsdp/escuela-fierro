"use client";

import { useRouter } from "next/navigation";
import { BookOpen, LogOut } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function Navbar() {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="bg-[#1B3A7A] h-16 flex items-center justify-between px-6">
      <Link href="/escuela" className="flex items-center gap-2">
        <BookOpen className="h-7 w-7 text-[#F5A623]" />
        <span className="text-white font-bold text-xl tracking-tight">
          Escuela Fierro
        </span>
      </Link>

      <button
        onClick={handleLogout}
        className="flex items-center gap-2 text-white/80 hover:text-white transition-colors text-sm font-medium"
      >
        <LogOut className="h-4 w-4" />
        Cerrar sesión
      </button>
    </header>
  );
}
