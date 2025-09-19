// lib/ai-recommendations.ts

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { groqApi } from "./groq-api" // Import the Groq API client


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
      recommendationType: 'diverse', // Request diverse recommendations
      count: 10, // Increase the number of recommendations requested
      includeDetails: true,
      prompt: {
        title: 'Generate actionable and diverse study recommendations',
        description: 'Provide a variety of personalized tips, strategies, and actionable insights to help students improve their academic performance and overall learning experience. Give very minimal response and no markdown formatting. Always genarete randomly from the following categories: study_tip, schedule_optimization, attendance_improvement, task_prioritization. Ensure recommendations are specific, practical, and tailored to individual student needs. Avoid generic advice and focus on actionable steps that can lead to measurable improvements. Consider factors such as attendance patterns, task management, and study habits. If applicable, suggest ways to optimize their schedule based on their busiest days: ' + (studentData.schedule ? analyzeBusyDays(studentData.schedule).join(", ") : "No schedule data available") + '. Provide a mix of high, medium, and low priority recommendations with clear estimated impacts.'
      }
    });
    console.log("Groq API response:", groqRecommendations);
    // If Groq API returned valid recommendations, use them
    if (groqRecommendations && groqRecommendations.length > 0) {
      console.log("Using Groq AI recommendations");
      return groqRecommendations.map((rec: any) => ({
        ...rec,
        type: rec.type as Recommendation["type"],
        priority: rec.priority as Recommendation["priority"],
      }));
    }
    // Fall back to the existing recommendation system if Groq fails
    console.log("Falling back to default recommendation system");
    return generateDefaultRecommendations(studentData);
  } catch (error) {
    console.error("Error using Groq API for recommendations:", error);
    // Fall back to the existing recommendation system
    return generateDefaultRecommendations(studentData);
  }

  // Wrapper around the original recommendation generation logic for fallback
  function generateDefaultRecommendations(studentData: StudentData): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Example recommendation: Improve attendance
    if (studentData.attendance_rate < 75) {
      recommendations.push({
        id: "1",
        type: "attendance_improvement",
        title: "Improve Attendance",
        description: "Your attendance rate is below 75%. Consider attending more classes to improve your performance.",
        priority: "high",
        actionable: true,
        estimated_impact: "High - Regular attendance improves understanding and grades.",
        category: "Attendance",
      });
    }

    // Example recommendation: Task prioritization
    if (studentData.tasks.length > 0) {
      recommendations.push({
        id: "2",
        type: "task_prioritization",
        title: "Prioritize Tasks",
        description: "You have pending tasks. Focus on completing them before the due dates.",
        priority: "medium",
        actionable: true,
        estimated_impact: "Medium - Timely task completion reduces stress.",
        category: "Tasks",
      });
    }

    // Example recommendation: Study tips
    recommendations.push({
      id: "3",
      type: "study_tip",
      title: "Effective Study Techniques",
      description: "Consider using flashcards and group study sessions to enhance learning.",
      priority: "low",
      actionable: false,
      estimated_impact: "Low - Incremental improvements in study habits.",
      category: "Study",
    });

    return recommendations;
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
  function analyzeBusyDays(schedule: any[]): string[] {
    // Count number of classes per day
    const dayCounts: Record<string, number> = {};
    for (const entry of schedule) {
      // Assume each entry has a 'day' field (e.g., "Monday")
      const day = entry.day || (entry.classes && entry.classes.day);
      if (day) {
        dayCounts[day] = (dayCounts[day] || 0) + 1;
      }
    }
    // Find the days with the most classes (busiest)
    const maxCount = Math.max(0, ...Object.values(dayCounts));
    if (maxCount === 0) return [];
    // Return all days that have the max count
      return Object.entries(dayCounts)
        .filter(([_, count]) => count === maxCount)
        .map(([day]) => day);
    }
  
  }

