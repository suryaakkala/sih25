import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

interface StudentData {
  id: string
  attendance_rate: number
  recent_attendance: any[]
  tasks: any[]
  schedule: any[]
  performance_metrics: any
}

interface Recommendation {
  id: string
  type: "study_tip" | "schedule_optimization" | "attendance_improvement" | "task_prioritization"
  title: string
  description: string
  priority: "high" | "medium" | "low"
  actionable: boolean
  estimated_impact: string
  category: string
}

export async function generatePersonalizedRecommendations(userId: string): Promise<Recommendation[]> {
  const cookieStore = cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
    },
  })

  // Fetch comprehensive student data
  const studentData = await fetchStudentData(supabase, userId)

  if (!studentData) {
    return getDefaultRecommendations()
  }

  const recommendations: Recommendation[] = []

  // Attendance-based recommendations
  if (studentData.attendance_rate < 80) {
    recommendations.push({
      id: "attendance_improvement",
      type: "attendance_improvement",
      title: "Improve Your Attendance",
      description: `Your attendance rate is ${studentData.attendance_rate}%. Try setting reminders 15 minutes before each class and using the location-based check-in feature.`,
      priority: "high",
      actionable: true,
      estimated_impact: "High - Better attendance correlates with 15-20% grade improvement",
      category: "Attendance",
    })
  }

  // Task management recommendations
  const overdueTasks =
    studentData.tasks?.filter((task) => new Date(task.due_date) < new Date() && task.status !== "completed").length || 0

  if (overdueTasks > 0) {
    recommendations.push({
      id: "task_prioritization",
      type: "task_prioritization",
      title: "Tackle Overdue Tasks",
      description: `You have ${overdueTasks} overdue tasks. Focus on completing these first, starting with the highest priority ones.`,
      priority: "high",
      actionable: true,
      estimated_impact: "Medium - Reduces stress and improves academic performance",
      category: "Task Management",
    })
  }

  // Schedule optimization
  const busyDays = analyzeBusyDays(studentData.schedule)
  if (busyDays.length > 0) {
    recommendations.push({
      id: "schedule_optimization",
      type: "schedule_optimization",
      title: "Optimize Your Busy Days",
      description: `${busyDays.join(", ")} appear to be your busiest days. Consider preparing materials the night before and using break times for quick reviews.`,
      priority: "medium",
      actionable: true,
      estimated_impact: "Medium - Better time management reduces stress",
      category: "Schedule",
    })
  }

  // Study pattern recommendations
  const studyRecommendations = generateStudyRecommendations(studentData)
  recommendations.push(...studyRecommendations)

  // Performance-based recommendations
  if (studentData.performance_metrics) {
    const performanceRecs = generatePerformanceRecommendations(studentData.performance_metrics)
    recommendations.push(...performanceRecs)
  }

  // Ensure we have at least some recommendations
  if (recommendations.length === 0) {
    recommendations.push(...getDefaultRecommendations())
  }

  return recommendations.slice(0, 6) // Limit to 6 recommendations
}

async function fetchStudentData(supabase: any, userId: string): Promise<StudentData | null> {
  try {
    // Fetch attendance data
    const { data: attendance } = await supabase
      .from("attendance")
      .select("*")
      .eq("student_id", userId)
      .order("check_in_time", { ascending: false })
      .limit(30)

    // Calculate attendance rate
    const totalClasses = attendance?.length || 0
    const presentCount = attendance?.filter((a) => a.status === "present").length || 0
    const attendance_rate = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 100

    // Fetch tasks
    const { data: tasks } = await supabase
      .from("tasks")
      .select("*")
      .eq("student_id", userId)
      .order("due_date", { ascending: true })

    // Fetch schedule
    const { data: schedule } = await supabase
      .from("schedules")
      .select(`
        *,
        classes(name, location)
      `)
      .eq("student_id", userId)

    return {
      id: userId,
      attendance_rate,
      recent_attendance: attendance?.slice(0, 10) || [],
      tasks: tasks || [],
      schedule: schedule || [],
      performance_metrics: null, // Would be calculated from grades/assessments
    }
  } catch (error) {
    console.error("Error fetching student data:", error)
    return null
  }
}

function analyzeBusyDays(schedule: any[]): string[] {
  const dayCount: { [key: string]: number } = {}

  schedule.forEach((item) => {
    const day = item.day_of_week
    dayCount[day] = (dayCount[day] || 0) + 1
  })

  return Object.entries(dayCount)
    .filter(([_, count]) => count >= 4)
    .map(([day, _]) => day.charAt(0).toUpperCase() + day.slice(1))
}

function generateStudyRecommendations(studentData: StudentData): Recommendation[] {
  const recommendations: Recommendation[] = []

  // Time-based study recommendations
  const currentHour = new Date().getHours()
  if (currentHour >= 9 && currentHour <= 11) {
    recommendations.push({
      id: "morning_study",
      type: "study_tip",
      title: "Optimize Morning Study Time",
      description:
        "Research shows that 9-11 AM is optimal for analytical thinking. Use this time for your most challenging subjects.",
      priority: "medium",
      actionable: true,
      estimated_impact: "Medium - 10-15% improvement in retention",
      category: "Study Tips",
    })
  }

  // Task completion pattern analysis
  const completedTasks = studentData.tasks.filter((t) => t.status === "completed").length
  const totalTasks = studentData.tasks.length

  if (totalTasks > 0 && completedTasks / totalTasks < 0.7) {
    recommendations.push({
      id: "task_completion",
      type: "task_prioritization",
      title: "Improve Task Completion Rate",
      description:
        "Try breaking large tasks into smaller, manageable chunks. Use the Pomodoro Technique: 25 minutes focused work, 5-minute break.",
      priority: "medium",
      actionable: true,
      estimated_impact: "High - Structured approach increases completion by 25%",
      category: "Productivity",
    })
  }

  return recommendations
}

function generatePerformanceRecommendations(performanceMetrics: any): Recommendation[] {
  // This would analyze grades, test scores, assignment completion rates, etc.
  // For now, return some general performance recommendations
  return [
    {
      id: "active_learning",
      type: "study_tip",
      title: "Try Active Learning Techniques",
      description:
        "Instead of just reading, try explaining concepts out loud, creating mind maps, or teaching someone else.",
      priority: "medium",
      actionable: true,
      estimated_impact: "High - Active learning improves retention by 50%",
      category: "Study Methods",
    },
  ]
}

function getDefaultRecommendations(): Recommendation[] {
  return [
    {
      id: "default_attendance",
      type: "attendance_improvement",
      title: "Maintain Perfect Attendance",
      description: "Keep up your great attendance! Use the mobile app to check in quickly and never miss a class.",
      priority: "low",
      actionable: true,
      estimated_impact: "High - Consistent attendance is key to academic success",
      category: "Attendance",
    },
    {
      id: "default_organization",
      type: "task_prioritization",
      title: "Stay Organized",
      description:
        "Use the task management system to keep track of assignments and deadlines. Set reminders for important due dates.",
      priority: "medium",
      actionable: true,
      estimated_impact: "Medium - Organization reduces stress and improves performance",
      category: "Organization",
    },
    {
      id: "default_study",
      type: "study_tip",
      title: "Establish a Study Routine",
      description:
        "Create a consistent study schedule. Even 30 minutes of focused study daily can significantly improve your grades.",
      priority: "medium",
      actionable: true,
      estimated_impact: "High - Regular study habits improve long-term retention",
      category: "Study Habits",
    },
  ]
}

export async function trackRecommendationInteraction(
  userId: string,
  recommendationId: string,
  action: "viewed" | "dismissed" | "acted_upon",
) {
  const cookieStore = cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
    },
  })

  await supabase.from("recommendation_interactions").insert({
    user_id: userId,
    recommendation_id: recommendationId,
    action,
    timestamp: new Date().toISOString(),
  })
}

export function generateSmartNotifications(studentData: StudentData): any[] {
  const notifications = []

  // Upcoming class notifications
  const now = new Date()
  const upcomingClasses = studentData.schedule.filter((item) => {
    const classTime = new Date(`${now.toDateString()} ${item.start_time}`)
    const timeDiff = classTime.getTime() - now.getTime()
    return timeDiff > 0 && timeDiff <= 15 * 60 * 1000 // Next 15 minutes
  })

  upcomingClasses.forEach((classItem) => {
    notifications.push({
      type: "class_reminder",
      title: "Class Starting Soon",
      message: `${classItem.classes.name} starts in 15 minutes at ${classItem.classes.location}`,
      priority: "high",
      action_url: "/attendance/check-in",
    })
  })

  // Task deadline notifications
  const urgentTasks = studentData.tasks.filter((task) => {
    const dueDate = new Date(task.due_date)
    const timeDiff = dueDate.getTime() - now.getTime()
    return timeDiff > 0 && timeDiff <= 24 * 60 * 60 * 1000 && task.status !== "completed" // Due within 24 hours
  })

  urgentTasks.forEach((task) => {
    notifications.push({
      type: "task_deadline",
      title: "Assignment Due Soon",
      message: `"${task.title}" is due tomorrow. Don't forget to complete it!`,
      priority: "medium",
      action_url: "/dashboard/student/tasks",
    })
  })

  return notifications
}
