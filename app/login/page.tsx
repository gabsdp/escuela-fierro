"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LogIn, BookOpen } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, type LoginInput } from "@/lib/schemas";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setLoading(true);
    setError("");

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (authError) {
      setError("Credenciales inválidas");
      setLoading(false);
      return;
    }

    window.location.href = "/admin";
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
            <h1 className="text-2xl font-bold text-[#1B3A7A] mb-1">
              Iniciar sesión
            </h1>
            <p className="text-[#666666] mb-6">
              Ingresá a la plataforma de capacitación
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#212121] mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  {...register("email")}
                  className="w-full px-3 py-2.5 border border-[#E0E0E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E6FBF] focus:border-transparent"
                  placeholder="tu@email.com"
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[#212121] mb-1">
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  {...register("password")}
                  className="w-full px-3 py-2.5 border border-[#E0E0E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E6FBF] focus:border-transparent"
                  placeholder="••••••"
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
                <LogIn className="h-4 w-4" />
                {loading ? "Ingresando..." : "Ingresar"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-[#666666]">
              El acceso es gestionado por el equipo de Fierro.
            </p>
            <p className="mt-2 text-center text-xs text-[#999]">
              <Link href="/setup" className="hover:underline">
                Configuración inicial
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
