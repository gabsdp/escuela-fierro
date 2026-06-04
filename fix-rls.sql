-- ============================================
-- FIX: Eliminar recursión infinita en RLS
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- 1. Borrar TODAS las políticas existentes en profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- 2. Función helper que evita recursión (SECURITY DEFINER)
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

-- 3. Recrear políticas de profiles (ahora usando is_admin())
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

-- 4. Recrear políticas de courses (usando is_admin())
ALTER TABLE public.courses DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view all courses" ON public.courses;
DROP POLICY IF EXISTS "Students can view assigned published courses" ON public.courses;
DROP POLICY IF EXISTS "Anyone can view published courses" ON public.courses;
DROP POLICY IF EXISTS "Admins can insert courses" ON public.courses;
DROP POLICY IF EXISTS "Admins can update courses" ON public.courses;
DROP POLICY IF EXISTS "Admins can delete courses" ON public.courses;

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

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- 5. Recrear políticas de modules
ALTER TABLE public.modules DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Students can view published modules of assigned courses" ON public.modules;
DROP POLICY IF EXISTS "Admins can view all modules" ON public.modules;
DROP POLICY IF EXISTS "Admins can insert modules" ON public.modules;
DROP POLICY IF EXISTS "Admins can update modules" ON public.modules;
DROP POLICY IF EXISTS "Admins can delete modules" ON public.modules;

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

ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

-- 6. Recrear políticas de module_files
ALTER TABLE public.module_files DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Students can view files of assigned modules" ON public.module_files;
DROP POLICY IF EXISTS "Admins can view all files" ON public.module_files;
DROP POLICY IF EXISTS "Admins can insert files" ON public.module_files;
DROP POLICY IF EXISTS "Admins can delete files" ON public.module_files;

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

ALTER TABLE public.module_files ENABLE ROW LEVEL SECURITY;

-- 7. Recrear políticas de user_courses
ALTER TABLE public.user_courses DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Students can view own assignments" ON public.user_courses;
DROP POLICY IF EXISTS "Admins can view all assignments" ON public.user_courses;
DROP POLICY IF EXISTS "Admins can insert assignments" ON public.user_courses;
DROP POLICY IF EXISTS "Admins can delete assignments" ON public.user_courses;

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

ALTER TABLE public.user_courses ENABLE ROW LEVEL SECURITY;

-- 8. Recrear políticas de user_progress
ALTER TABLE public.user_progress DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own progress" ON public.user_progress;
DROP POLICY IF EXISTS "Admins can view all progress" ON public.user_progress;
DROP POLICY IF EXISTS "Users can upsert own progress" ON public.user_progress;
DROP POLICY IF EXISTS "Users can update own progress" ON public.user_progress;

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

ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- 9. Storage policies
DROP POLICY IF EXISTS "Anyone can view files from attachments bucket" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete files" ON storage.objects;

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
