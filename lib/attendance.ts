import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function getAttendanceStats(userId: string, role: string) {
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: {
      async get(name: string) {
        return (await cookieStore).get(name)?.value
      }
    },
  })

  if (role === "student") {
    // Get student attendance statistics
    const { data: attendance, error } = await supabase
      .from("attendance")
      .select(`
        id,
        status,
        check_in_time,
        classes(name)
      `)
      .eq("student_id", userId)
      .order("check_in_time", { ascending: false })
      .limit(30)

    if (error) {
      console.error("Error fetching attendance:", error)
      return null
    }

    const totalClasses = attendance?.length || 0
    const presentCount = attendance?.filter((a) => a.status === "present").length || 0
    const attendanceRate = totalClasses > 0 ? (presentCount / totalClasses) * 100 : 0

    return {
      totalClasses,
      presentCount,
      absentCount: totalClasses - presentCount,
      attendanceRate: Math.round(attendanceRate),
      recentAttendance: attendance?.slice(0, 5) || [],
    }
  }

  if (role === "teacher") {
    // Get teacher's class attendance overview
    const { data: classes, error } = await supabase
      .from("classes")
      .select(`
        id,
        name,
        attendance(
          id,
          status,
          check_in_time
        )
      `)
      .eq("teacher_id", userId)

    if (error) {
      console.error("Error fetching teacher classes:", error)
      return null
    }

    const totalSessions = classes?.reduce((sum, cls) => sum + (cls.attendance?.length || 0), 0) || 0
    const totalPresent =
      classes?.reduce((sum, cls) => sum + (cls.attendance?.filter((a) => a.status === "present").length || 0), 0) || 0

    return {
      totalClasses: classes?.length || 0,
      totalSessions,
      totalPresent,
      averageAttendance: totalSessions > 0 ? Math.round((totalPresent / totalSessions) * 100) : 0,
      classes: classes || [],
    }
  }

  return null
}

export async function validateAttendanceSession(sessionId: string, classId: string) {
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: {
      async get(name: string) {
        return (await cookieStore).get(name)?.value
      }
    },
  })

  const { data: session, error } = await supabase
    .from("attendance_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("class_id", classId)
    .eq("is_active", true)
    .single()

  if (error || !session) {
    return { valid: false, error: "Invalid or expired session" }
  }

  // Check if session has expired (30 minutes)
  const expiresAt = new Date(session.expires_at)
  const now = new Date()

  if (now > expiresAt) {
    // Deactivate expired session
    await supabase.from("attendance_sessions").update({ is_active: false }).eq("id", sessionId)

    return { valid: false, error: "Session has expired" }
  }

  return { valid: true, session }
}

export async function recordAttendance(data: {
  studentId: string
  classId: string
  sessionId?: string
  checkInMethod: "qr" | "location" | "biometric"
  locationLat?: number
  locationLng?: number
}) {
  const cookieStore = cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: {
      async get(name: string) {
        return (await cookieStore).get(name)?.value
      }
    },
  })

  // Check for duplicate attendance
  const { data: existing } = await supabase
    .from("attendance")
    .select("id")
    .eq("student_id", data.studentId)
    .eq("class_id", data.classId)
    .eq("session_id", data.sessionId || "")
    .single()

  if (existing) {
    return { success: false, error: "Already checked in" }
  }

  // Record attendance
  const { error } = await supabase.from("attendance").insert({
    student_id: data.studentId,
    class_id: data.classId,
    session_id: data.sessionId,
    check_in_time: new Date().toISOString(),
    check_in_method: data.checkInMethod,
    location_lat: data.locationLat,
    location_lng: data.locationLng,
    status: "present",
  })

  if (error) {
    console.error("Error recording attendance:", error)
    return { success: false, error: "Failed to record attendance" }
  }

  return { success: true }
}
