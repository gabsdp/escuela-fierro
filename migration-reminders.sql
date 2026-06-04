-- ============================================
-- MIGRACIÓN: Recordatorios automáticos
-- Ejecutar en Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS public.reminder_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE UNIQUE,
  days_inactive INTEGER NOT NULL DEFAULT 5,
  message TEXT NOT NULL DEFAULT 'Hola, vemos que todavía no comenzaste el curso. ¿Necesitás ayuda? Escribinos a soporte@fierro.com.ar',
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reminder_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: reminder_configs
ALTER TABLE public.reminder_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view reminder configs"
  ON public.reminder_configs FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can insert reminder configs"
  ON public.reminder_configs FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update reminder configs"
  ON public.reminder_configs FOR UPDATE
  USING (public.is_admin());

-- RLS: reminder_logs
ALTER TABLE public.reminder_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view reminder logs"
  ON public.reminder_logs FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can insert reminder logs"
  ON public.reminder_logs FOR INSERT
  WITH CHECK (public.is_admin());
