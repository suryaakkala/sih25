export type UserRole = "student" | "teacher" | "admin" | "career_counselor"
export type AttendanceStatus = "present" | "absent" | "late" | "excused"
export type TaskPriority = "low" | "medium" | "high" | "urgent"
export type TaskStatus = "pending" | "in_progress" | "completed" | "overdue"
export type NotificationType = "attendance" | "task" | "schedule" | "system"

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  student_id?: string
  department?: string
  year_level?: number
  profile_image_url?: string
  phone_number?: string
  emergency_contact?: string
  created_at: string
  updated_at: string
}

export interface Class {
  id: string
  name: string
  code: string
  description?: string
  teacher_id?: string
  department?: string
  credits: number
  max_students: number
  created_at: string
  updated_at: string
  teacher?: Profile
}

export interface AttendanceSession {
  id: string
  class_id: string
  teacher_id?: string
  session_date: string
  start_time: string
  end_time?: string
  qr_code?: string
  location_lat?: number
  location_lng?: number
  location_radius: number
  is_active: boolean
  created_at: string
  class?: Class
}

export interface AttendanceRecord {
  id: string
  session_id: string
  student_id: string
  status: AttendanceStatus
  check_in_time?: string
  check_in_method?: string
  notes?: string
  created_at: string
  updated_at: string
  student?: Profile
  session?: AttendanceSession
}

export interface Task {
  id: string
  title: string
  description?: string
  class_id?: string
  assigned_by?: string
  assigned_to: string
  priority: TaskPriority
  status: TaskStatus
  due_date?: string
  estimated_duration?: number
  ai_generated: boolean
  ai_reasoning?: string
  created_at: string
  updated_at: string
  class?: Class
  assignedBy?: Profile
}

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  is_read: boolean
  action_url?: string
  created_at: string
}

export interface StudentAnalytics {
  id: string
  student_id: string
  class_id: string
  attendance_rate: number
  total_sessions: number
  present_sessions: number
  late_sessions: number
  absent_sessions: number
  task_completion_rate: number
  average_task_score: number
  last_updated: string
  class?: Class
}
