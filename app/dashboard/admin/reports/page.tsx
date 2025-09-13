import { requireAdmin } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { format, parseISO, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns"

export default async function AdminReportsPage() {
  const profile = await requireAdmin()
  const supabase = await createClient()

  const today = new Date()
  const thisWeek = { start: startOfWeek(today), end: endOfWeek(today) }
  const thisMonth = { start: startOfMonth(today), end: endOfMonth(today) }

  // Get attendance statistics
  const { data: attendanceRecords } = await supabase
    .from("attendance_records")
    .select("status, created_at")
    .gte("created_at", thisMonth.start.toISOString())
    .lte("created_at", thisMonth.end.toISOString())

  const attendanceStats = attendanceRecords?.reduce(
    (acc, record) => {
      acc[record.status] = (acc[record.status] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const totalAttendance = attendanceRecords?.length || 0
  const presentRate = totalAttendance > 0 ? ((attendanceStats?.present || 0) / totalAttendance) * 100 : 0

  // Get user statistics
  const { data: allUsers } = await supabase.from("profiles").select("role, created_at")
  const usersByRole = allUsers?.reduce(
    (acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  // Get class statistics
  const { data: classes } = await supabase.from("classes").select(`
      *,
      class_enrollments(count),
      attendance_sessions(count)
    `)

  // Get recent sessions for activity report
  const { data: recentSessions } = await supabase
    .from("attendance_sessions")
    .select(`
      *,
      classes:class_id (name, code),
      teacher:teacher_id (full_name)
    `)
    .gte("created_at", subDays(today, 30).toISOString())
    .order("created_at", { ascending: false })
    .limit(20)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
              <p className="text-gray-600">System performance and usage analytics</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
                Export Report
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard/admin">Back to Dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-blue-600">{allUsers?.length || 0}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
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
                  <p className="text-sm font-medium text-gray-600">Active Classes</p>
                  <p className="text-2xl font-bold text-green-600">{classes?.length || 0}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
                  <p className="text-2xl font-bold text-purple-600">{presentRate.toFixed(1)}%</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
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
                  <p className="text-sm font-medium text-gray-600">This Month</p>
                  <p className="text-2xl font-bold text-orange-600">{totalAttendance}</p>
                  <p className="text-xs text-gray-500">Records</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reports Tabs */}
        <Tabs defaultValue="attendance" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="classes">Classes</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="attendance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Attendance Overview */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Monthly Attendance Overview</CardTitle>
                  <CardDescription>Attendance statistics for {format(today, "MMMM yyyy")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">{attendanceStats?.present || 0}</p>
                        <p className="text-sm text-gray-600">Present</p>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <p className="text-2xl font-bold text-yellow-600">{attendanceStats?.late || 0}</p>
                        <p className="text-sm text-gray-600">Late</p>
                      </div>
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <p className="text-2xl font-bold text-red-600">{attendanceStats?.absent || 0}</p>
                        <p className="text-sm text-gray-600">Absent</p>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">{attendanceStats?.excused || 0}</p>
                        <p className="text-sm text-gray-600">Excused</p>
                      </div>
                    </div>
                    <div className="pt-4 border-t">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Overall Attendance Rate</span>
                        <span className="text-sm text-gray-600">{presentRate.toFixed(1)}%</span>
                      </div>
                      <Progress value={presentRate} className="h-3" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Attendance Trends */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Attendance Trends</CardTitle>
                  <CardDescription>Weekly and monthly patterns</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium mb-3">By Status</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Present</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-600 h-2 rounded-full"
                                style={{
                                  width: `${totalAttendance > 0 ? ((attendanceStats?.present || 0) / totalAttendance) * 100 : 0}%`,
                                }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600">{attendanceStats?.present || 0}</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Late</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-yellow-600 h-2 rounded-full"
                                style={{
                                  width: `${totalAttendance > 0 ? ((attendanceStats?.late || 0) / totalAttendance) * 100 : 0}%`,
                                }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600">{attendanceStats?.late || 0}</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Absent</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-red-600 h-2 rounded-full"
                                style={{
                                  width: `${totalAttendance > 0 ? ((attendanceStats?.absent || 0) / totalAttendance) * 100 : 0}%`,
                                }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600">{attendanceStats?.absent || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>User Distribution</CardTitle>
                <CardDescription>Breakdown of users by role</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center p-6 bg-blue-50 rounded-lg">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <p className="text-3xl font-bold text-blue-600">{usersByRole?.student || 0}</p>
                    <p className="text-sm text-gray-600">Students</p>
                  </div>
                  <div className="text-center p-6 bg-green-50 rounded-lg">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                    </div>
                    <p className="text-3xl font-bold text-green-600">{usersByRole?.teacher || 0}</p>
                    <p className="text-sm text-gray-600">Teachers</p>
                  </div>
                  <div className="text-center p-6 bg-purple-50 rounded-lg">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </svg>
                    </div>
                    <p className="text-3xl font-bold text-purple-600">{usersByRole?.admin || 0}</p>
                    <p className="text-sm text-gray-600">Admins</p>
                  </div>
                  <div className="text-center p-6 bg-orange-50 rounded-lg">
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <p className="text-3xl font-bold text-orange-600">{usersByRole?.career_counselor || 0}</p>
                    <p className="text-sm text-gray-600">Counselors</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="classes" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Class Statistics</CardTitle>
                <CardDescription>Overview of all classes and their activity</CardDescription>
              </CardHeader>
              <CardContent>
                {classes && classes.length > 0 ? (
                  <div className="space-y-4">
                    {classes.map((classItem) => (
                      <div key={classItem.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-900">{classItem.name}</h4>
                            <Badge variant="outline">{classItem.code}</Badge>
                          </div>
                          <p className="text-sm text-gray-600">Department: {classItem.department}</p>
                          <p className="text-sm text-gray-600">Schedule: {classItem.schedule}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">
                            Enrollments: {classItem.class_enrollments?.[0]?.count || 0}
                          </p>
                          <p className="text-sm text-gray-600">
                            Sessions: {classItem.attendance_sessions?.[0]?.count || 0}
                          </p>
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
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                    <p className="text-gray-500">No classes found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest attendance sessions and system activity</CardDescription>
              </CardHeader>
              <CardContent>
                {recentSessions && recentSessions.length > 0 ? (
                  <div className="space-y-4">
                    {recentSessions.map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-900">{session.classes?.name}</h4>
                            <Badge variant="outline">{session.classes?.code}</Badge>
                            {session.is_active && (
                              <Badge variant="default" className="bg-green-600">
                                Active
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">Teacher: {session.teacher?.full_name}</p>
                          <p className="text-xs text-gray-500">
                            {format(parseISO(session.created_at), "MMM d, yyyy 'at' h:mm a")}
                          </p>
                        </div>
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/dashboard/admin/sessions/${session.id}`}>View Details</Link>
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
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="text-gray-500">No recent activity</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
