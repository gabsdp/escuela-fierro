import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

export const registerSchema = z.object({
  full_name: z.string().min(2, "Mínimo 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

export const courseSchema = z.object({
  title: z.string().min(3, "Mínimo 3 caracteres"),
  product_key: z.enum([
    "libreria",
    "editorial",
    "fierrogo_libreria",
    "fierrogo_editorial",
    "distribuidora",
  ]),
  description: z.string().default(""),
  order_index: z.number().default(0),
  published: z.boolean().default(false),
});

export const moduleSchema = z.object({
  title: z.string().min(3, "Mínimo 3 caracteres"),
  description: z.string().default(""),
  video_url: z.string().default(""),
  published: z.boolean().default(false),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CourseInput = z.infer<typeof courseSchema>;
export type ModuleInput = z.infer<typeof moduleSchema>;
