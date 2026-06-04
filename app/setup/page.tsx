"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Shield, BookOpen, ArrowRight } from "lucide-react";
import Link from "next/link";
import { z } from "zod";

const setupSchema = z.object({
  full_name: z.string().min(2, "Mínimo 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

type SetupInput = z.infer<typeof setupSchema>;

export default function SetupPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SetupInput>({
    resolver: zodResolver(setupSchema),
  });

  const onSubmit = async (data: SetupInput) => {
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/create-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await res.json();

    if (!res.ok) {
      setError(result.error || "Error al crear el usuario");
      setLoading(false);
      return;
    }

    // Now set role to admin
    const setAdminRes = await fetch("/api/admin/set-admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: result.user.id }),
    });

    if (!setAdminRes.ok) {
      setError("Error al configurar como admin");
      setLoading(false);
      return;
    }

    router.push("/login");
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="bg-[#1B3A7A] h-16 flex items-center px-6">
        <Link href="/" className="flex items-center gap-2">
          <BookOpen className="h-7 w-7 text-[#F5A623]" />
          <span className="text-white font-bold text-xl tracking-tight">
            Fierro Escuela
          </span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl shadow-lg border border-[#E0E0E0] p-8">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="h-5 w-5 text-[#F5A623]" />
              <h1 className="text-xl font-bold text-[#1B3A7A]">
                Configuración inicial
              </h1>
            </div>
            <p className="text-[#666666] mb-6">
              Creá la cuenta de administrador para empezar a usar la plataforma.
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#212121] mb-1">
                  Nombre completo
                </label>
                <input
                  type="text"
                  {...register("full_name")}
                  className="w-full px-3 py-2.5 border border-[#E0E0E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E6FBF] focus:border-transparent"
                  placeholder="Tu nombre y apellido"
                />
                {errors.full_name && (
                  <p className="text-red-500 text-xs mt-1">{errors.full_name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#212121] mb-1">
                  Email
                </label>
                <input
                  type="email"
                  {...register("email")}
                  className="w-full px-3 py-2.5 border border-[#E0E0E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E6FBF] focus:border-transparent"
                  placeholder="admin@fierro.com.ar"
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#212121] mb-1">
                  Contraseña
                </label>
                <input
                  type="password"
                  {...register("password")}
                  className="w-full px-3 py-2.5 border border-[#E0E0E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E6FBF] focus:border-transparent"
                  placeholder="Mínimo 8 caracteres"
                />
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#F5A623] text-white font-semibold py-2.5 rounded-lg hover:bg-[#e09515] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Shield className="h-4 w-4" />
                {loading ? "Creando..." : "Crear administrador"}
              </button>
            </form>

            <p className="mt-4 text-center text-sm text-[#666666]">
              ¿Ya tenés cuenta?{" "}
              <Link href="/login" className="text-[#1E6FBF] font-medium hover:underline">
                Iniciá sesión
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
