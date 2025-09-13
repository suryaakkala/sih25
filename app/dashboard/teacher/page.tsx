import { requireTeacher } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { format, parseISO } from "date-fns"
import UserMenu from "@/components/user-menu"

export default async function TeacherDashboard() {
  const profile = await requireTeacher()
  const supabase = await createClient()

  // Get teacher's classes
  const { data: classes } = await supabase.from("classes").select("*").eq("teacher_id", profile.id)

  const classIds = classes?.map((c) => c.id) || []

  // Get today's schedule
  const today = new Date().getDay()
  const { data: todaySchedule } = await supabase
    .from("schedules")
    .select(`
      *,
      classes:class_id (*)
    `)
    .eq("day_of_week", today)
    .in("class_id", classIds)
    .order("start_time")

  // Get active attendance sessions
  const { data: activeSessions } = await supabase
    .from("attendance_sessions")
    .select(`
      *,
      classes:class_id (name, code)
    `)
    .eq("teacher_id", profile.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  // Get recent attendance records for teacher's classes
  const { data: recentAttendance } = await supabase
    .from("attendance_records")
    .select(`
      *,
      student:student_id (full_name, student_id),
      session:session_id (
        classes:class_id (name, code)
      )
    `)
    .in(
      "session_id",
      (
        await supabase
          .from("attendance_sessions")
          .select("id")
          .in("class_id", classIds)
          .order("created_at", { ascending: false })
          .limit(10)
      ).data?.map((s) => s.id) || [],
    )
    .order("created_at", { ascending: false })
    .limit(10)

  // Get class enrollment counts
  const { data: enrollmentCounts } = await supabase
    .from("class_enrollments")
    .select("class_id")
    .in("class_id", classIds)

  const enrollmentsByClass = enrollmentCounts?.reduce(
    (acc, enrollment) => {
      acc[enrollment.class_id] = (acc[enrollment.class_id] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  // Get tasks assigned by teacher
  const { data: assignedTasks } = await supabase
    .from("tasks")
    .select(`
      *,
      classes:class_id (name, code),
      assignedTo:assigned_to (full_name, student_id)
    `)
    .eq("assigned_by", profile.id)
    .order("created_at", { ascending: false })
    .limit(5)

  const totalStudents = Object.values(enrollmentsByClass || {}).reduce((sum, count) => sum + count, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Welcome, Professor {profile.full_name}!</h1>
              <p className="text-gray-600">{profile.department} Department</p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/teacher/classes/new">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New Class
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
                  <p className="text-sm font-medium text-gray-600">My Classes</p>
                  <p className="text-2xl font-bold text-blue-600">{classes?.length || 0}</p>
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
                  <p className="text-sm font-medium text-gray-600">Total Students</p>
                  <p className="text-2xl font-bold text-green-600">{totalStudents}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  <p className="text-sm font-medium text-gray-600">Active Sessions</p>
                  <p className="text-2xl font-bold text-orange-600">{activeSessions?.length || 0}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0M7 20h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
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
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
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
                          <p className="text-sm text-gray-600">{schedule.classes?.code}</p>
                          <p className="text-sm text-gray-500">Room: {schedule.room || "TBA"}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">
                            {format(new Date(`2000-01-01T${schedule.start_time}`), "h:mm a")} -{" "}
                            {format(new Date(`2000-01-01T${schedule.end_time}`), "h:mm a")}
                          </p>
                          <div className="flex gap-2 mt-2">
                            <Button size="sm" asChild>
                              <Link href={`/dashboard/teacher/attendance/start/${schedule.class_id}`}>
                                Start Session
                              </Link>
                            </Button>
                            <Button size="sm" variant="outline" asChild>
                              <Link href={`/dashboard/teacher/classes/${schedule.class_id}`}>View Class</Link>
                            </Button>
                          </div>
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

            {/* Recent Attendance */}
            <Card className="border-0 shadow-lg mt-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Recent Attendance
                </CardTitle>
                <CardDescription>Latest check-ins from your students</CardDescription>
              </CardHeader>
              <CardContent>
                {recentAttendance && recentAttendance.length > 0 ? (
                  <div className="space-y-3">
                    {recentAttendance.slice(0, 5).map((record) => (
                      <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{record.student?.full_name}</p>
                          <p className="text-sm text-gray-600">
                            {record.student?.student_id} • {record.session?.classes?.code}
                          </p>
                          <p className="text-xs text-gray-500">
                            {format(parseISO(record.created_at), "MMM d, h:mm a")}
                          </p>
                        </div>
                        <Badge
                          variant={
                            record.status === "present"
                              ? "default"
                              : record.status === "late"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {record.status}
                        </Badge>
                      </div>
                    ))}
                    <div className="text-center pt-4">
                      <Button variant="outline" asChild>
                        <Link href="/dashboard/teacher/attendance">View All Attendance</Link>
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
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="text-gray-500">No recent attendance records</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Active Sessions */}
            {activeSessions && activeSessions.length > 0 && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    Active Sessions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {activeSessions.map((session) => (
                      <div key={session.id} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <h5 className="font-medium text-gray-900">{session.classes?.name}</h5>
                        <p className="text-sm text-gray-600">{session.classes?.code}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Started: {format(parseISO(session.start_time), "h:mm a")}
                        </p>
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/dashboard/teacher/attendance/session/${session.id}`}>Manage</Link>
                          </Button>
                          <Button size="sm" variant="destructive" asChild>
                            <Link href={`/dashboard/teacher/attendance/end/${session.id}`}>End</Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* My Classes */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                  My Classes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {classes && classes.length > 0 ? (
                  <div className="space-y-3">
                    {classes.slice(0, 4).map((classItem) => (
                      <div key={classItem.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-medium text-gray-900">{classItem.code}</h5>
                          <Badge variant="outline">{enrollmentsByClass?.[classItem.id] || 0} students</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{classItem.name}</p>
                        <Button size="sm" variant="outline" className="w-full bg-transparent" asChild>
                          <Link href={`/dashboard/teacher/classes/${classItem.id}`}>Manage Class</Link>
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" className="w-full bg-transparent" asChild>
                      <Link href="/dashboard/teacher/classes">View All Classes</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500 mb-3">No classes yet</p>
                    <Button size="sm" asChild>
                      <Link href="/dashboard/teacher/classes/new">Create First Class</Link>
                    </Button>
                  </div>
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
                  <Link href="/dashboard/teacher/attendance">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6-3a9 9 0 11-18 0 9 9 0 0118 0M7 20h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    Attendance Reports
                  </Link>
                </Button>
                <Button className="w-full justify-start bg-transparent" variant="outline" asChild>
                  <Link href="/dashboard/teacher/tasks">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    Manage Tasks
                  </Link>
                </Button>
                <Button className="w-full justify-start bg-transparent" variant="outline" asChild>
                  <Link href="/dashboard/teacher/schedule">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    View Schedule
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Recent Tasks */}
            {assignedTasks && assignedTasks.length > 0 && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    Recent Tasks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {assignedTasks.slice(0, 3).map((task) => (
                      <div key={task.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-start mb-1">
                          <h5 className="font-medium text-gray-900 text-sm">{task.title}</h5>
                          <Badge variant="outline" className="text-xs">
                            {task.priority}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600">{task.assignedTo?.full_name}</p>
                        <p className="text-xs text-gray-500">{task.classes?.code}</p>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" className="w-full bg-transparent" asChild>
                      <Link href="/dashboard/teacher/tasks">View All Tasks</Link>
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
