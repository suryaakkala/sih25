-- Fix infinite recursion in profiles RLS policy
-- The issue: the policy was querying the same table it was protecting

-- Drop the problematic policy
DROP POLICY IF EXISTS "Teachers and admins can view all profiles" ON public.profiles;

-- Create a security definer function to check user roles
-- This function runs with elevated privileges and bypasses RLS
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS user_role
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role_result user_role;
BEGIN
  SELECT role INTO user_role_result
  FROM public.profiles
  WHERE id = user_id;
  
  RETURN COALESCE(user_role_result, 'student');
END;
$$;

-- Create new policy using the security definer function
-- This avoids infinite recursion by using a function that bypasses RLS
CREATE POLICY "Teachers and admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    public.get_user_role(auth.uid()) IN ('teacher', 'admin', 'career_counselor')
  );

-- Also fix other policies that might have similar issues
DROP POLICY IF EXISTS "Teachers and admins can manage classes" ON public.classes;
CREATE POLICY "Teachers and admins can manage classes" ON public.classes
  FOR ALL USING (
    public.get_user_role(auth.uid()) IN ('teacher', 'admin')
  );

-- Fix class enrollments policy
DROP POLICY IF EXISTS "Teachers can view enrollments for their classes" ON public.class_enrollments;
CREATE POLICY "Teachers can view enrollments for their classes" ON public.class_enrollments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = class_id AND (
        c.teacher_id = auth.uid() OR 
        public.get_user_role(auth.uid()) IN ('admin', 'career_counselor')
      )
    )
  );

-- Fix attendance records policy
DROP POLICY IF EXISTS "Teachers can manage attendance for their classes" ON public.attendance_records;
CREATE POLICY "Teachers can manage attendance for their classes" ON public.attendance_records
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.attendance_sessions s
      JOIN public.classes c ON c.id = s.class_id
      WHERE s.id = session_id AND (
        c.teacher_id = auth.uid() OR 
        public.get_user_role(auth.uid()) IN ('admin', 'career_counselor')
      )
    )
  );

-- Fix tasks policy
DROP POLICY IF EXISTS "Teachers can manage tasks for their classes" ON public.tasks;
CREATE POLICY "Teachers can manage tasks for their classes" ON public.tasks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = class_id AND (
        c.teacher_id = auth.uid() OR 
        public.get_user_role(auth.uid()) IN ('admin', 'career_counselor')
      )
    )
  );
