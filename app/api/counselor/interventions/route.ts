import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireCounselor } from "@/lib/auth"
import { grokApi } from "@/lib/grok-api"

export async function POST(request: Request) {
  try {
    // Ensure user is a counselor
    const profile = await requireCounselor()
    
    // Get request body
    const { studentId, specificConcern } = await request.json()
    
    if (!studentId) {
      return NextResponse.json({ error: "Student ID is required" }, { status: 400 })
    }
    
    // Create Supabase client
    const supabase = await createClient()
    
    // Fetch comprehensive student data for AI analysis
    const { data: studentData, error: studentError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", studentId)
      .single()
      
    if (studentError) {
      console.error("Error fetching student data:", studentError)
      return NextResponse.json({ error: "Failed to fetch student data" }, { status: 500 })
    }
    
    // Fetch attendance data
    const { data: attendanceData, error: attendanceError } = await supabase
      .from("attendance_records")
      .select(`
        *,
        session:session_id (
          *,
          class:class_id (name, code)
        )
      `)
      .eq("student_id", studentId)
      .order("check_in_time", { ascending: false })
      .limit(20)
      
    if (attendanceError) {
      console.error("Error fetching attendance data:", attendanceError)
      return NextResponse.json({ error: "Failed to fetch attendance data" }, { status: 500 })
    }
    
    // Fetch task data
    const { data: taskData, error: taskError } = await supabase
      .from("tasks")
      .select("*")
      .eq("assigned_to", studentId)
      .order("due_date", { ascending: false })
      .limit(20)
      
    if (taskError) {
      console.error("Error fetching task data:", taskError)
      return NextResponse.json({ error: "Failed to fetch task data" }, { status: 500 })
    }
    
    // Fetch analytics data
    const { data: analyticsData, error: analyticsError } = await supabase
      .from("student_analytics")
      .select(`
        *,
        class:class_id (name, code)
      `)
      .eq("student_id", studentId)
      
    if (analyticsError) {
      console.error("Error fetching analytics data:", analyticsError)
      return NextResponse.json({ error: "Failed to fetch analytics data" }, { status: 500 })
    }
    
    // Process attendance data into a summary format
    const attendanceSummary = {
      total_sessions: attendanceData.length,
      present_count: attendanceData.filter(a => a.status === "present").length,
      absent_count: attendanceData.filter(a => a.status === "absent").length,
      late_count: attendanceData.filter(a => a.status === "late").length,
      excused_count: attendanceData.filter(a => a.status === "excused").length,
      attendance_rate: attendanceData.length > 0 
        ? (attendanceData.filter(a => a.status === "present" || a.status === "late").length / attendanceData.length) * 100 
        : 100,
      recent_attendance: attendanceData.slice(0, 5).map(a => ({ 
        date: a.check_in_time,
        status: a.status,
        class: a.session?.class?.name || "Unknown"
      }))
    }
    
    // Process task data into a summary format
    const taskSummary = {
      total_tasks: taskData.length,
      completed_count: taskData.filter(t => t.status === "completed").length,
      pending_count: taskData.filter(t => t.status === "pending").length,
      overdue_count: taskData.filter(t => 
        t.status !== "completed" && new Date(t.due_date) < new Date()
      ).length,
      completion_rate: taskData.length > 0
        ? (taskData.filter(t => t.status === "completed").length / taskData.length) * 100
        : 100,
      recent_tasks: taskData.slice(0, 5).map(t => ({
        title: t.title,
        status: t.status,
        due_date: t.due_date,
        priority: t.priority
      }))
    }
    
    // Use Grok API to generate intervention suggestions
    try {
      const interventionSuggestions = await grokApi.generateInterventionSuggestions({
        studentData,
        attendanceData: attendanceSummary,
        taskCompletionData: taskSummary,
        academicPerformance: analyticsData,
        specificConcern: specificConcern || undefined
      })
      
      return NextResponse.json({
        suggestions: interventionSuggestions,
        studentSummary: {
          profile: studentData,
          attendance: attendanceSummary,
          tasks: taskSummary,
          analytics: analyticsData
        }
      })
      
    } catch (error: any) {
      console.error("Grok API error:", error)
      
      // Return a fallback response with basic suggestions
      return NextResponse.json({
        error: "AI suggestion generation failed",
        errorDetail: error.message,
        suggestions: generateFallbackSuggestions(studentData, attendanceSummary, taskSummary),
        studentSummary: {
          profile: studentData,
          attendance: attendanceSummary,
          tasks: taskSummary,
          analytics: analyticsData
        }
      }, { status: 207 }) // 207 Multi-Status: partial success
    }
    
  } catch (error: any) {
    console.error("Error in intervention suggestion API:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

/**
 * Generate fallback suggestions if the Grok API fails
 */
function generateFallbackSuggestions(studentData: any, attendanceData: any, taskData: any) {
  const suggestions = []
  
  // Add attendance-based suggestion if needed
  if (attendanceData.attendance_rate < 75) {
    suggestions.push({
      id: "attendance_intervention",
      type: "attendance",
      title: "Schedule Attendance Intervention",
      approach: "One-on-one meeting",
      description: `${studentData.full_name} has an attendance rate of ${attendanceData.attendance_rate.toFixed(1)}%. 
        Schedule a meeting to discuss barriers to attendance and develop an improvement plan.`,
      urgency: "immediate",
      expected_outcome: "Improved attendance within 2 weeks",
      follow_up: "Weekly check-ins for the next month"
    })
  }
  
  // Add task-based suggestion if needed
  if (taskData.completion_rate < 70) {
    suggestions.push({
      id: "task_management_intervention",
      type: "academic",
      title: "Task Management Support",
      approach: "Study skills workshop",
      description: `${studentData.full_name} has a task completion rate of ${taskData.completion_rate.toFixed(1)}%. 
        Recommend enrollment in a time management workshop and provide one-on-one task prioritization guidance.`,
      urgency: "soon",
      expected_outcome: "Improved task completion rate and reduced late submissions",
      follow_up: "Review progress in 3 weeks"
    })
  }
  
  // Always add a general support suggestion
  suggestions.push({
    id: "general_support",
    type: "personal",
    title: "General Academic Support Check-in",
    approach: "Casual check-in meeting",
    description: `Schedule a general check-in with ${studentData.full_name} to assess overall academic satisfaction 
      and identify any unreported challenges or concerns.`,
    urgency: "monitoring",
    expected_outcome: "Early identification of potential issues",
    follow_up: "Regular semester check-ins"
  })
  
  return suggestions
}