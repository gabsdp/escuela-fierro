-- ============================================
-- Fierro Escuela - Schema SQL para Supabase
-- Ejecutar en SQL Editor: https://supabase.com/dashboard
-- ============================================

-- ============================================
-- PARTE 1: Crear todas las tablas
-- ============================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'student')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  product_key TEXT NOT NULL CHECK (product_key IN (
    'libreria', 'editorial', 'fierrogo_libreria', 'fierrogo_editorial', 'distribuidora'
  )),
  description TEXT DEFAULT '',
  order_index INTEGER NOT NULL DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  assigned_by UUID REFERENCES public.profiles(id),
  UNIQUE(user_id, course_id)
);

CREATE TABLE IF NOT EXISTS public.modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  video_url TEXT DEFAULT '',
  order_index INTEGER NOT NULL DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.module_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, module_id)
);

-- ============================================
-- PARTE 2: Función helper (evita recursión infinita en RLS)
-- ============================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ============================================
-- PARTE 3: Activar RLS y crear políticas
-- ============================================

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Courses
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all courses"
  ON public.courses FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Students can view assigned published courses"
  ON public.courses FOR SELECT
  USING (
    published = true
    AND EXISTS (
      SELECT 1 FROM public.user_courses uc
      WHERE uc.course_id = courses.id AND uc.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view published courses"
  ON public.courses FOR SELECT
  USING (published = true);

CREATE POLICY "Admins can insert courses"
  ON public.courses FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update courses"
  ON public.courses FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete courses"
  ON public.courses FOR DELETE
  USING (public.is_admin());

-- Modules
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view published modules of assigned courses"
  ON public.modules FOR SELECT
  USING (
    published = true
    AND EXISTS (
      SELECT 1 FROM public.user_courses uc
      WHERE uc.course_id = modules.course_id AND uc.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all modules"
  ON public.modules FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can insert modules"
  ON public.modules FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update modules"
  ON public.modules FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete modules"
  ON public.modules FOR DELETE
  USING (public.is_admin());

-- Module files
ALTER TABLE public.module_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view files of assigned modules"
  ON public.module_files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.modules m
      JOIN public.user_courses uc ON uc.course_id = m.course_id
      WHERE m.id = module_files.module_id
        AND uc.user_id = auth.uid()
        AND m.published = true
    )
  );

CREATE POLICY "Admins can view all files"
  ON public.module_files FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can insert files"
  ON public.module_files FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete files"
  ON public.module_files FOR DELETE
  USING (public.is_admin());

-- User courses
ALTER TABLE public.user_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own assignments"
  ON public.user_courses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all assignments"
  ON public.user_courses FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can insert assignments"
  ON public.user_courses FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete assignments"
  ON public.user_courses FOR DELETE
  USING (public.is_admin());

-- User progress
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress"
  ON public.user_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all progress"
  ON public.user_progress FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Users can upsert own progress"
  ON public.user_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON public.user_progress FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- PARTE 4: Checklist items, FAQ items y progreso de checklist
-- ============================================

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

-- RLS: module_checklist_items
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

-- RLS: module_faq_items
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

-- RLS: user_checklist_progress
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

-- ============================================
-- PARTE 5: Storage y triggers
-- ============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view files from attachments bucket"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'attachments');

CREATE POLICY "Admins can upload files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'attachments'
    AND public.is_admin()
  );

CREATE POLICY "Admins can delete files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'attachments'
    AND public.is_admin()
  );

-- Trigger: crear perfil al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    'student'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
