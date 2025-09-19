-- Create user roles enum
CREATE TYPE user_role AS ENUM ('student', 'teacher', 'admin', 'career_counselor');

-- Create attendance status enum
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'excused');

-- Create task priority enum
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Create task status enum
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'overdue');

-- Create notification type enum
CREATE TYPE notification_type AS ENUM ('attendance', 'task', 'schedule', 'system');

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  student_id TEXT UNIQUE,
  department TEXT,
  year_level INTEGER,
  profile_image_url TEXT,
  phone_number TEXT,
  emergency_contact TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create classes table
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  department TEXT,
  semester INTEGER,
  batch TEXT,
  credits INTEGER DEFAULT 3,
  max_students INTEGER DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create class_enrollments table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS public.class_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, class_id)
);

-- Create schedules table
CREATE TABLE IF NOT EXISTS public.schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create attendance_sessions table
CREATE TABLE IF NOT EXISTS public.attendance_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  session_date DATE NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  qr_code TEXT UNIQUE,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  location_radius INTEGER DEFAULT 50, -- meters
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create attendance_records table
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status attendance_status NOT NULL DEFAULT 'absent',
  check_in_time TIMESTAMP WITH TIME ZONE,
  check_in_method TEXT, -- 'qr_code', 'geolocation', 'manual', 'facial_recognition'
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, student_id)
);


-- Create tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  priority task_priority DEFAULT 'medium',
  status task_status DEFAULT 'pending',
  due_date TIMESTAMP WITH TIME ZONE,
  estimated_duration INTEGER, -- minutes
  ai_generated BOOLEAN DEFAULT FALSE,
  ai_reasoning TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create student_analytics table
CREATE TABLE IF NOT EXISTS public.student_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  attendance_rate DECIMAL(5,2) DEFAULT 0.00,
  total_sessions INTEGER DEFAULT 0,
  present_sessions INTEGER DEFAULT 0,
  late_sessions INTEGER DEFAULT 0,
  absent_sessions INTEGER DEFAULT 0,
  task_completion_rate DECIMAL(5,2) DEFAULT 0.00,
  average_task_score DECIMAL(5,2) DEFAULT 0.00,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, class_id)
);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_analytics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Teachers and admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('teacher', 'admin', 'career_counselor')
    )
  );

-- Create RLS policies for classes
CREATE POLICY "Everyone can view classes" ON public.classes
  FOR SELECT USING (true);

CREATE POLICY "Teachers and admins can manage classes" ON public.classes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('teacher', 'admin')
    )
  );

-- Create RLS policies for class_enrollments
CREATE POLICY "Students can view their enrollments" ON public.class_enrollments
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Teachers can view enrollments for their classes" ON public.class_enrollments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.classes c
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE c.id = class_id AND (c.teacher_id = auth.uid() OR p.role IN ('admin', 'career_counselor'))
    )
  );

-- Create RLS policies for attendance_records
CREATE POLICY "Students can view their own attendance" ON public.attendance_records
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Students can insert their own attendance" ON public.attendance_records
  FOR INSERT WITH CHECK (student_id = auth.uid());


CREATE POLICY "Teachers can manage attendance for their classes" ON public.attendance_records
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.attendance_sessions s
      JOIN public.classes c ON c.id = s.class_id
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE s.id = session_id AND (c.teacher_id = auth.uid() OR p.role IN ('admin', 'career_counselor'))
    )
  );

-- Create RLS policies for tasks
CREATE POLICY "Users can view their assigned tasks" ON public.tasks
  FOR SELECT USING (assigned_to = auth.uid());

CREATE POLICY "Teachers can manage tasks for their classes" ON public.tasks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.classes c
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE c.id = class_id AND (c.teacher_id = auth.uid() OR p.role IN ('admin', 'career_counselor'))
    )
  );

-- Create RLS policies for notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

-- Create function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'New User'),
    COALESCE((NEW.raw_user_meta_data ->> 'role')::user_role, 'student')
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create function to update attendance analytics
CREATE OR REPLACE FUNCTION public.update_attendance_analytics()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.student_analytics (student_id, class_id, total_sessions, present_sessions, late_sessions, absent_sessions)
  SELECT 
    NEW.student_id,
    s.class_id,
    COUNT(*) as total_sessions,
    COUNT(*) FILTER (WHERE NEW.status = 'present') as present_sessions,
    COUNT(*) FILTER (WHERE NEW.status = 'late') as late_sessions,
    COUNT(*) FILTER (WHERE NEW.status = 'absent') as absent_sessions
  FROM public.attendance_sessions s
  WHERE s.id = NEW.session_id
  GROUP BY NEW.student_id, s.class_id
  ON CONFLICT (student_id, class_id)
  DO UPDATE SET
    total_sessions = student_analytics.total_sessions + 1,
    present_sessions = CASE WHEN NEW.status = 'present' THEN student_analytics.present_sessions + 1 ELSE student_analytics.present_sessions END,
    late_sessions = CASE WHEN NEW.status = 'late' THEN student_analytics.late_sessions + 1 ELSE student_analytics.late_sessions END,
    absent_sessions = CASE WHEN NEW.status = 'absent' THEN student_analytics.absent_sessions + 1 ELSE student_analytics.absent_sessions END,
    attendance_rate = ROUND(
      (CASE WHEN NEW.status IN ('present', 'late') THEN student_analytics.present_sessions + student_analytics.late_sessions + 1 
       ELSE student_analytics.present_sessions + student_analytics.late_sessions END) * 100.0 / 
      (student_analytics.total_sessions + 1), 2
    ),
    last_updated = NOW();
  
  RETURN NEW;
END;
$$;

-- Create trigger for attendance analytics
DROP TRIGGER IF EXISTS on_attendance_record_created ON public.attendance_records;
CREATE TRIGGER on_attendance_record_created
  AFTER INSERT ON public.attendance_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_attendance_analytics();
