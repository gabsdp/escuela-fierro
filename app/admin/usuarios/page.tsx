"use client";

import { useState, useEffect } from "react";
import { Search, User, Book, UserPlus } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";

interface UserWithCount extends Profile {
  course_count: number;
}

export default function AdminUsuariosPage() {
  const [users, setUsers] = useState<UserWithCount[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      const usersWithCourses = await Promise.all(
        (profiles ?? []).map(async (profile) => {
          const { count } = await supabase
            .from("user_courses")
            .select("*", { count: "exact", head: true })
            .eq("user_id", profile.id);
          return { ...profile, course_count: count ?? 0 } as UserWithCount;
        }),
      );

      setUsers(usersWithCourses);
      setLoading(false);
    }
    load();
  }, [supabase]);

  const filtered = users.filter(
    (u) =>
      (u.full_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4" />
        <div className="h-10 bg-gray-200 rounded" />
        {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-gray-200 rounded-lg" />)}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1B3A7A] flex items-center gap-2">
            <User className="h-6 w-6 text-[#F5A623]" />
            Usuarios
          </h1>
          <p className="text-[#666666] mt-1">{users.length} usuarios registrados</p>
        </div>
        <Link
          href="/admin/usuarios/nuevo"
          className="bg-[#F5A623] text-white font-semibold px-4 py-2.5 rounded-lg hover:bg-[#e09515] transition-colors flex items-center gap-2 text-sm"
        >
          <UserPlus className="h-4 w-4" />
          Crear usuario
        </Link>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666666]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-[#E0E0E0] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1E6FBF] focus:border-transparent"
          placeholder="Buscar por nombre o email..."
        />
      </div>

      <div className="bg-white rounded-xl border border-[#E0E0E0] overflow-hidden">
        <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-[#E0E0E0] text-xs font-semibold text-[#666666] uppercase tracking-wider">
          <div className="col-span-4">Nombre</div>
          <div className="col-span-4">Email</div>
          <div className="col-span-2">Rol</div>
          <div className="col-span-2">Cursos</div>
        </div>

        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-center text-[#666666]">
            No se encontraron usuarios.
          </div>
        ) : (
          filtered.map((u) => (
            <Link
              key={u.id}
              href={`/admin/usuarios/${u.id}`}
              className="grid grid-cols-12 gap-4 px-6 py-3.5 border-b border-[#E0E0E0] hover:bg-gray-50 transition-colors text-sm"
            >
              <div className="col-span-4 font-medium text-[#212121] truncate">
                {u.full_name || "—"}
              </div>
              <div className="col-span-4 text-[#666666] truncate">{u.email}</div>
              <div className="col-span-2">
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    u.role === "admin"
                      ? "bg-purple-100 text-purple-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {u.role}
                </span>
              </div>
              <div className="col-span-2 text-[#666666] flex items-center gap-1">
                <Book className="h-3.5 w-3.5" />
                {u.course_count}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
