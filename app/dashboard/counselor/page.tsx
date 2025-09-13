import { requireCounselor } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { format, parseISO } from "date-fns"
import UserMenu from "@/components/user-menu"

export default async function CounselorDashboard() {
  const profile = await requireCounselor()
  const supabase = await createClient()

  // Get all students for counseling overview
  const { data: students } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "student")
    .order("created_at", { ascending: false })

  // Get student analytics for counseling insights
  const { data: studentAnalytics } = await supabase
    .from("student_analytics")
    .select(`
      *,
      student:student_id (full_name, student_id, email, department, year_level),
      classes:class_id (name, code)
    `)
    .order("attendance_rate", { ascending: true })
    .limit(10)

  // Get students with low attendance (need attention)
  const studentsNeedingAttention = studentAnalytics?.filter((s) => s.attendance_rate < 75) || []

  // Get recent tasks assigned to students
  const { data: recentTasks } = await supabase
    .from("tasks")
    .select(`
      *,
      assignedTo:assigned_to (full_name, student_id),
      classes:class_id (name, code)
    `)
    .order("created_at", { ascending: false })
    .limit(10)

  // Get overall system statistics for counseling insights
  const totalStudents = students?.length || 0
  const avgAttendanceRate =
    studentAnalytics?.reduce((sum, s) => sum + s.attendance_rate, 0) / (studentAnalytics?.length || 1) || 0
  const avgTaskCompletion =
    studentAnalytics?.reduce((sum, s) => sum + s.task_completion_rate, 0) / (studentAnalytics?.length || 1) || 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Counselor Dashboard</h1>
              <p className="text-gray-600">Student guidance and academic support</p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/counselor/students">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  View All Students
                </Link>
              </Button>
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
                  <p className="text-sm font-medium text-gray-600">Total Students</p>
                  <p className="text-2xl font-bold text-blue-600">{totalStudents}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
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
                  <p className="text-sm font-medium text-gray-600">Avg Attendance</p>
                  <p className="text-2xl font-bold text-green-600">{avgAttendanceRate.toFixed(1)}%</p>
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
                  <p className="text-sm font-medium text-gray-600">Task Completion</p>
                  <p className="text-2xl font-bold text-purple-600">{avgTaskCompletion.toFixed(1)}%</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
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
                  <p className="text-sm font-medium text-gray-600">Need Attention</p>
                  <p className="text-2xl font-bold text-red-600">{studentsNeedingAttention.length}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Students Needing Attention */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                  Students Needing Attention
                </CardTitle>
                <CardDescription>Students with low attendance rates requiring counseling support</CardDescription>
              </CardHeader>
              <CardContent>
                {studentsNeedingAttention.length > 0 ? (
                  <div className="space-y-4">
                    {studentsNeedingAttention.map((analytic) => (
                      <div key={analytic.id} className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-900">{analytic.student?.full_name}</h4>
                            <Badge variant="destructive">{analytic.attendance_rate.toFixed(1)}%</Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            {analytic.student?.student_id} • {analytic.student?.department} • Year{" "}
                            {analytic.student?.year_level}
                          </p>
                          <p className="text-sm text-gray-500">{analytic.classes?.code}</p>
                          <div className="flex gap-4 text-xs text-gray-500 mt-2">
                            <span>Present: {analytic.present_sessions}</span>
                            <span>Absent: {analytic.absent_sessions}</span>
                            <span>Total: {analytic.total_sessions}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" asChild>
                            <Link href={`/dashboard/counselor/students/${analytic.student_id}`}>Counsel</Link>
                          </Button>
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`mailto:${analytic.student?.email}`}>Email</Link>
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-gray-500">All students are performing well!</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Student Activity */}
            <Card className="border-0 shadow-lg mt-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Recent Task Activity
                </CardTitle>
                <CardDescription>Latest task assignments and completions</CardDescription>
              </CardHeader>
              <CardContent>
                {recentTasks && recentTasks.length > 0 ? (
                  <div className="space-y-3">
                    {recentTasks.slice(0, 5).map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h5 className="font-medium text-gray-900 text-sm">{task.title}</h5>
                            <Badge
                              variant={
                                task.status === "completed"
                                  ? "default"
                                  : task.status === "overdue"
                                    ? "destructive"
                                    : "secondary"
                              }
                            >
                              {task.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600">{task.assignedTo?.full_name}</p>
                          <p className="text-xs text-gray-500">
                            {task.classes?.code} • {format(parseISO(task.created_at), "MMM d, h:mm a")}
                          </p>
                        </div>
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/dashboard/counselor/tasks/${task.id}`}>View</Link>
                        </Button>
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
                        d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    <p className="text-gray-500">No recent task activity</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Quick Actions */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Counseling Tools</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start bg-transparent" variant="outline" asChild>
                  <Link href="/dashboard/counselor/students">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    Student Directory
                  </Link>
                </Button>
                <Button className="w-full justify-start bg-transparent" variant="outline" asChild>
                  <Link href="/dashboard/counselor/reports">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                    Academic Reports
                  </Link>
                </Button>
                <Button className="w-full justify-start bg-transparent" variant="outline" asChild>
                  <Link href="/dashboard/counselor/interventions">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Intervention Plans
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Department Overview */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  Department Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                {students && students.length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(
                      students.reduce(
                        (acc, student) => {
                          const dept = student.department || "Undeclared"
                          acc[dept] = (acc[dept] || 0) + 1
                          return acc
                        },
                        {} as Record<string, number>,
                      ),
                    )
                      .sort(([, a], [, b]) => (b as number) - (a as number))
                      .slice(0, 5)
                      .map(([department, count]) => (
                        <div key={department} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="text-sm text-gray-700">{department}</span>
                          <Badge variant="outline">{String(count)} students</Badge>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No department data available</p>
                )}
              </CardContent>
            </Card>

            {/* Performance Insights */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Performance Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-lg font-bold text-green-600">
                      {studentAnalytics?.filter((s) => s.attendance_rate >= 90).length || 0}
                    </p>
                    <p className="text-xs text-gray-600">Excellent Attendance (≥90%)</p>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <p className="text-lg font-bold text-yellow-600">
                      {studentAnalytics?.filter((s) => s.attendance_rate >= 75 && s.attendance_rate < 90).length || 0}
                    </p>
                    <p className="text-xs text-gray-600">Good Attendance (75-89%)</p>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <p className="text-lg font-bold text-red-600">
                      {studentAnalytics?.filter((s) => s.attendance_rate < 75).length || 0}
                    </p>
                    <p className="text-xs text-gray-600">Needs Attention (&lt;75%)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
