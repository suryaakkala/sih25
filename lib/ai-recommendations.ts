// lib/ai-recommendations.ts

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { groqApi } from "./groq-api"

interface StudentData {
  id: string;
  attendance_rate: number;
  recent_attendance: any[];
  tasks: any[];
  schedule: any[];
  performance_metrics: any;
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
    interface AttendanceRecord {
      status: string;
      check_in_time: string;
      [key: string]: any;
    }
    const presentCount = (attendance as AttendanceRecord[] | undefined)?.filter((a) => a.status === "present").length || 0
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
      .select(`*, classes(name, location)`)
      .eq("student_id", userId)

    return {
      id: userId,
      attendance_rate,
      recent_attendance: attendance?.slice(0, 10) || [],
      tasks: tasks || [],
      schedule: schedule || [],
      performance_metrics: null,
    }
  } catch (error) {
    console.error("Error fetching student data:", error)
    return null
  }
}

export async function generatePersonalizedRecommendations(userId: string): Promise<Recommendation[]> {
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      }
    },
  })

  // Fetch comprehensive student data
  const studentData = await fetchStudentData(supabase, userId)
  if (!studentData) {
    return getDefaultRecommendations()
  }

  try {
    // Try to use Groq API for advanced AI recommendations
    console.log("Student data sent to Groq API:", studentData);
    const groqRecommendations = await groqApi.generateRecommendations({
      studentData,
      recommendationType: 'diverse',
      count: 4, // Generate 2-4 recommendations
      includeDetails: true,
      prompt: {
        title: 'Generate personalized study recommendations',
        description: 'Create 2-4 specific, actionable recommendations based on the student data. Include clear titles and detailed descriptions.'
      }
    });
    
    console.log("Groq API recommendations:", groqRecommendations);
    
    // If Groq API returned valid recommendations, use them
    if (groqRecommendations && groqRecommendations.length > 0) {
      console.log("Using Groq AI recommendations");
      return groqRecommendations.slice(0, 4); // Ensure we return at most 4 recommendations
    }
    
    // Fall back to the default recommendation system if Groq fails
    console.log("Falling back to default recommendation system");
    return generateDefaultRecommendations(studentData);
  } catch (error) {
    console.error("Error using Groq API for recommendations:", error);
    // Fall back to the default recommendation system
    return generateDefaultRecommendations(studentData);
  }

  function generateDefaultRecommendations(studentData: StudentData): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Recommendation 1: Improve attendance
    if (studentData.attendance_rate < 75) {
      recommendations.push({
        id: "1",
        type: "attendance_improvement",
        title: "Improve Your Attendance Rate",
        description: "Your attendance rate is below 75%. Consider attending more classes to improve your performance and understanding of the material.",
        priority: "high",
        actionable: false,
        estimated_impact: "High impact on overall performance",
        category: "Attendance",
      });
    }

    // Recommendation 2: Task prioritization
    if (studentData.tasks.length > 0) {
      const pendingTasks = studentData.tasks.filter((task: any) => 
        task.status !== "completed" && task.status !== "archived"
      ).length;
      
      if (pendingTasks > 0) {
        recommendations.push({
          id: "2",
          type: "task_prioritization",
          title: "Prioritize Your Pending Tasks",
          description: `You have ${pendingTasks} pending tasks. Focus on completing them based on due dates to avoid last-minute stress.`,
          priority: "medium",
          actionable: false,
          estimated_impact: "Medium impact on stress reduction",
          category: "Task Management",
        });
      }
    }

    // Recommendation 3: Study tips
    recommendations.push({
      id: "3",
      type: "study_tip",
      title: "Implement Active Recall Techniques",
      description: "Research shows that active recall (self-testing) is more effective than passive review. Try summarizing what you've learned without looking at your notes.",
      priority: "medium",
      actionable: false,
      estimated_impact: "High impact on long-term retention",
      category: "Study Methods",
    });

    // Recommendation 4: Schedule optimization
    if (studentData.schedule && studentData.schedule.length > 0) {
      const busyDays = analyzeBusyDays(studentData.schedule);
      if (busyDays.length > 0) {
        recommendations.push({
          id: "4",
          type: "schedule_optimization",
          title: "Balance Your Study Schedule",
          description: `Your busiest days are ${busyDays.join(", ")}. Consider spreading out your study sessions to avoid burnout on these days.`,
          priority: "medium",
          actionable: false,
          estimated_impact: "Medium impact on workload management",
          category: "Schedule Planning",
        });
      }
    }

    return recommendations.slice(0, 4); // Return at most 4 recommendations
  }

  function getDefaultRecommendations(): Recommendation[] {
    return [
      {
        id: "default_attendance",
        type: "attendance_improvement",
        title: "Maintain Consistent Attendance",
        description: "Regular attendance is strongly correlated with academic success. Try to attend all your classes and arrive on time.",
        priority: "high",
        actionable: false,
        estimated_impact: "High impact on learning outcomes",
        category: "Attendance",
      },
      {
        id: "default_organization",
        type: "task_prioritization",
        title: "Organize Your Study Materials",
        description: "Keep your notes, assignments, and study materials well-organized. This will save you time and reduce stress when preparing for exams.",
        priority: "medium",
        actionable: false,
        estimated_impact: "Medium impact on study efficiency",
        category: "Organization",
      },
      {
        id: "default_study",
        type: "study_tip",
        title: "Develop a Consistent Study Routine",
        description: "Establish a regular study schedule with dedicated time slots for each subject. Consistency is key to effective learning.",
        priority: "medium",
        actionable: false,
        estimated_impact: "High impact on knowledge retention",
        category: "Study Habits",
      },
    ];
  }

  function analyzeBusyDays(schedule: any[]): string[] {
    const dayCounts: Record<string, number> = {};
    for (const entry of schedule) {
      const day = entry.day || (entry.classes && entry.classes.day);
      if (day) {
        dayCounts[day] = (dayCounts[day] || 0) + 1;
      }
    }
    
    const maxCount = Math.max(0, ...Object.values(dayCounts));
    if (maxCount === 0) return [];
    
    return Object.entries(dayCounts)
      .filter(([_, count]) => count === maxCount)
      .map(([day]) => day);
  }
}