import { requireStudent } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import AIRecommendations from "@/components/ai-recommendations"
import Link from "next/link"
import { format, parseISO } from "date-fns"
import UserMenu from "@/components/user-menu"

export default async function StudentDashboard() {
  const profile = await requireStudent()
  const supabase = await createClient()

  // Get student's enrolled classes
  const { data: enrollments } = await supabase
    .from("class_enrollments")
    .select(`
      *,
      classes:class_id (
        *,
        teacher:teacher_id (full_name)
      )
    `)
    .eq("student_id", profile.id)

  // Get today's schedule
  const today = new Date().getDay()
  const { data: todaySchedule } = await supabase
    .from("schedules")
    .select(`
      *,
      classes:class_id (
        *,
        teacher:teacher_id (full_name)
      )
    `)
    .eq("day_of_week", today)
    .in("class_id", enrollments?.map((e) => e.class_id) || [])
    .order("start_time")

  // Get pending tasks
  const { data: tasks } = await supabase
    .from("tasks")
    .select(`
      *,
      classes:class_id (name, code)
    `)
    .eq("assigned_to", profile.id)
    .in(["pending", "in_progress"], ["status"])
    .order("due_date", { ascending: true })
    .limit(5)

  // Get attendance analytics
  const { data: analytics } = await supabase
    .from("student_analytics")
    .select(`
      *,
      classes:class_id (name, code)
    `)
    .eq("student_id", profile.id)

  // Get recent notifications
  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", profile.id)
    .eq("is_read", false)
    .order("created_at", { ascending: false })
    .limit(3)

  const overallAttendanceRate =
    analytics?.reduce((sum, a) => sum + a.attendance_rate, 0) / (analytics?.length || 1) || 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Welcome back, {profile.full_name}!</h1>
              <p className="text-gray-600">
                {profile.student_id && `Student ID: ${profile.student_id}`} • {profile.department}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {notifications && notifications.length > 0 && (
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/student/notifications">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-5 5v-5zM4.828 4.828A4 4 0 015.5 4H9v1H5.5a3 3 0 00-2.121.879l-.707-.707z"
                      />
                    </svg>
                    {notifications.length} New
                  </Link>
                </Button>
              )}
              <UserMenu user={profile} />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Overall Attendance</p>
                  <p className="text-2xl font-bold text-green-600">{overallAttendanceRate.toFixed(1)}%</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Enrolled Classes</p>
                  <p className="text-2xl font-bold text-blue-600">{enrollments?.length || 0}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Tasks</p>
                  <p className="text-2xl font-bold text-orange-600">{tasks?.length || 0}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Today's Classes</p>
                  <p className="text-2xl font-bold text-purple-600">{todaySchedule?.length || 0}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Today's Schedule */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Today's Schedule
                </CardTitle>
                <CardDescription>Your classes for today</CardDescription>
              </CardHeader>
              <CardContent>
                {todaySchedule && todaySchedule.length > 0 ? (
                  <div className="space-y-4">
                    {todaySchedule.map((schedule) => (
                      <div key={schedule.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{schedule.classes?.name}</h4>
                          <p className="text-sm text-gray-600">
                            {schedule.classes?.code} • {schedule.classes?.teacher?.full_name}
                          </p>
                          <p className="text-sm text-gray-500">Room: {schedule.room || "TBA"}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">
                            {format(new Date(`2000-01-01T${schedule.start_time}`), "h:mm a")} -{" "}
                            {format(new Date(`2000-01-01T${schedule.end_time}`), "h:mm a")}
                          </p>
                          <Button size="sm" className="mt-2" asChild>
                            <Link href={`/attendance/check-in`}>Check In</Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <svg
                      className="w-12 h-12 text-gray-400 mx-auto mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="text-gray-500">No classes scheduled for today</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI Recommendations */}
            <div className="mt-8">
              <AIRecommendations />
            </div>

            {/* Pending Tasks */}
            <Card className="border-0 shadow-lg mt-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                  </svg>
                  Pending Tasks
                </CardTitle>
                <CardDescription>Your upcoming assignments and tasks</CardDescription>
              </CardHeader>
              <CardContent>
                {tasks && tasks.length > 0 ? (
                  <div className="space-y-4">
                    {tasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-900">{task.title}</h4>
                            <Badge
                              variant={
                                task.priority === "urgent"
                                  ? "destructive"
                                  : task.priority === "high"
                                    ? "default"
                                    : "secondary"
                              }
                            >
                              {task.priority}
                            </Badge>
                            {task.ai_generated && (
                              <Badge variant="outline" className="text-blue-600 border-blue-200">
                                AI
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{task.classes?.name}</p>
                          {task.due_date && (
                            <p className="text-sm text-gray-500">
                              Due: {format(parseISO(task.due_date), "MMM d, yyyy 'at' h:mm a")}
                            </p>
                          )}
                        </div>
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/dashboard/student/tasks/${task.id}`}>View</Link>
                        </Button>
                      </div>
                    ))}
                    <div className="text-center pt-4">
                      <Button variant="outline" asChild>
                        <Link href="/dashboard/student/tasks">View All Tasks</Link>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <svg
                      className="w-12 h-12 text-gray-400 mx-auto mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                      />
                    </svg>
                    <p className="text-gray-500">No pending tasks</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Attendance Overview */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  Attendance Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analytics && analytics.length > 0 ? (
                  <div className="space-y-4">
                    {analytics.slice(0, 3).map((analytic) => (
                      <div key={analytic.id} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">{analytic.classes?.code}</span>
                          <span className="text-sm text-gray-600">{analytic.attendance_rate.toFixed(1)}%</span>
                        </div>
                        <Progress value={analytic.attendance_rate} className="h-2" />
                        <p className="text-xs text-gray-500">
                          {analytic.present_sessions + analytic.late_sessions} of {analytic.total_sessions} sessions
                        </p>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" className="w-full mt-4 bg-transparent" asChild>
                      <Link href="/dashboard/student/attendance">View Details</Link>
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No attendance data yet</p>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start bg-transparent" variant="outline" asChild>
                  <Link href="/dashboard/student/schedule">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    View Full Schedule
                  </Link>
                </Button>
                <Button className="w-full justify-start bg-transparent" variant="outline" asChild>
                  <Link href="/dashboard/student/classes">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                    My Classes
                  </Link>
                </Button>
                <Button className="w-full justify-start bg-transparent" variant="outline" asChild>
                  <Link href="/dashboard/student/tasks">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    All Tasks
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Recent Notifications */}
            {notifications && notifications.length > 0 && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-5 5v-5zM4.828 4.828A4 4 0 015.5 4H9v1H5.5a3 3 0 00-2.121.879l-.707-.707z"
                      />
                    </svg>
                    Recent Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {notifications.map((notification) => (
                      <div key={notification.id} className="p-3 bg-blue-50 rounded-lg">
                        <h5 className="font-medium text-gray-900 text-sm">{notification.title}</h5>
                        <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {format(parseISO(notification.created_at), "MMM d, h:mm a")}
                        </p>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" className="w-full bg-transparent" asChild>
                      <Link href="/dashboard/student/notifications">View All</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
