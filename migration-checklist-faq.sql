-- ============================================
-- MIGRACIÓN: Checklist items, FAQ items y progreso de checklist
-- Ejecutar en Supabase SQL Editor:
--   https://supabase.com/dashboard/project/hvkfykapxobekmtgggse/sql/new
-- ============================================

-- 1. CREAR TABLAS
CREATE TABLE IF NOT EXISTS public.module_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.module_faq_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT DEFAULT '',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_checklist_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  checklist_item_id UUID NOT NULL REFERENCES public.module_checklist_items(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, checklist_item_id)
);

-- 2. ACTIVAR RLS Y CREAR POLÍTICAS

-- module_checklist_items
ALTER TABLE public.module_checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view checklist items of assigned modules"
  ON public.module_checklist_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.modules m
      JOIN public.user_courses uc ON uc.course_id = m.course_id
      WHERE m.id = module_checklist_items.module_id
        AND uc.user_id = auth.uid()
        AND m.published = true
    )
  );

CREATE POLICY "Admins can view all checklist items"
  ON public.module_checklist_items FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can insert checklist items"
  ON public.module_checklist_items FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update checklist items"
  ON public.module_checklist_items FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete checklist items"
  ON public.module_checklist_items FOR DELETE
  USING (public.is_admin());

-- module_faq_items
ALTER TABLE public.module_faq_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view FAQ items of assigned modules"
  ON public.module_faq_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.modules m
      JOIN public.user_courses uc ON uc.course_id = m.course_id
      WHERE m.id = module_faq_items.module_id
        AND uc.user_id = auth.uid()
        AND m.published = true
    )
  );

CREATE POLICY "Admins can view all FAQ items"
  ON public.module_faq_items FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can insert FAQ items"
  ON public.module_faq_items FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update FAQ items"
  ON public.module_faq_items FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete FAQ items"
  ON public.module_faq_items FOR DELETE
  USING (public.is_admin());

-- user_checklist_progress
ALTER TABLE public.user_checklist_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own checklist progress"
  ON public.user_checklist_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all checklist progress"
  ON public.user_checklist_progress FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Users can upsert own checklist progress"
  ON public.user_checklist_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own checklist progress"
  ON public.user_checklist_progress FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. TRIGGER para auto-crear progreso de checklist al asignar curso
-- (se crea bajo demanda: cuando el usuario abre el módulo por primera vez)

-- ============================================
-- LISTO. Las tablas ya están creadas con RLS.
-- Ahora ejecutar el seed script para cargar datos.
-- ============================================
