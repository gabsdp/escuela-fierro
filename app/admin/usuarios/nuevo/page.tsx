"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, UserPlus } from "lucide-react";
import Link from "next/link";
import { z } from "zod";

const createUserSchema = z.object({
  full_name: z.string().min(2, "Mínimo 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

type CreateUserInput = z.infer<typeof createUserSchema>;

export default function NuevoUsuarioPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
  });

  const onSubmit = async (data: CreateUserInput) => {
    setLoading(true);
    setError("");
    setSuccess("");

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

    setSuccess(`Usuario ${data.email} creado correctamente`);
    reset();
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link
        href="/admin/usuarios"
        className="inline-flex items-center gap-1.5 text-sm text-[#1E6FBF] hover:underline mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a usuarios
      </Link>

      <h1 className="text-2xl font-bold text-[#1B3A7A] mb-2">
        Crear usuario
      </h1>
      <p className="text-[#666666] mb-8">
        Creá una cuenta de estudiante. El usuario recibirá acceso inmediato.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-6 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 mb-6 text-sm">
          {success}
        </div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white rounded-xl border border-[#E0E0E0] p-6 space-y-4"
      >
        <div>
          <label
            htmlFor="full_name"
            className="block text-sm font-medium text-[#212121] mb-1"
          >
            Nombre completo
          </label>
          <input
            id="full_name"
            type="text"
            {...register("full_name")}
            className="w-full px-3 py-2.5 border border-[#E0E0E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E6FBF] focus:border-transparent"
            placeholder="Nombre y apellido del estudiante"
          />
          {errors.full_name && (
            <p className="text-red-500 text-xs mt-1">{errors.full_name.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-[#212121] mb-1"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            {...register("email")}
            className="w-full px-3 py-2.5 border border-[#E0E0E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E6FBF] focus:border-transparent"
            placeholder="estudiante@libreria.com"
          />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-[#212121] mb-1"
          >
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            {...register("password")}
            className="w-full px-3 py-2.5 border border-[#E0E0E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E6FBF] focus:border-transparent"
            placeholder="Mínimo 8 caracteres"
          />
          {errors.password && (
            <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E0E0E0]">
          <Link
            href="/admin/usuarios"
            className="px-4 py-2.5 text-sm font-medium text-[#666666] hover:text-[#212121] transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="bg-[#F5A623] text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-[#e09515] transition-colors disabled:opacity-50 flex items-center gap-2 text-sm"
          >
            <UserPlus className="h-4 w-4" />
            {loading ? "Creando..." : "Crear usuario"}
          </button>
        </div>
      </form>
    </div>
  );
}
