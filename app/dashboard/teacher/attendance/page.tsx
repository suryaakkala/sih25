import { requireTeacher } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { format, parseISO } from "date-fns"

export default async function TeacherAttendancePage() {
  const profile = await requireTeacher()
  const supabase = await createClient()

  // Get teacher's classes
  const { data: classes } = await supabase.from("classes").select("*").eq("teacher_id", profile.id)
  const classIds = classes?.map((c) => c.id) || []

  // Get all attendance sessions for teacher's classes
  const { data: sessions } = await supabase
    .from("attendance_sessions")
    .select(`
      *,
      classes:class_id (name, code)
    `)
    .in("class_id", classIds)
    .order("created_at", { ascending: false })

  // Get attendance records for recent sessions
  const recentSessionIds = sessions?.slice(0, 10).map((s) => s.id) || []
  const { data: attendanceRecords } = await supabase
    .from("attendance_records")
    .select(`
      *,
      student:student_id (full_name, student_id),
      session:session_id (
        session_date,
        classes:class_id (name, code)
      )
    `)
    .in("session_id", recentSessionIds)
    .order("created_at", { ascending: false })

  // Get attendance analytics
  const { data: analytics } = await supabase
    .from("student_analytics")
    .select(`
      *,
      student:student_id (full_name, student_id),
      classes:class_id (name, code)
    `)
    .in("class_id", classIds)
    .order("attendance_rate", { ascending: true })

  const activeSessions = sessions?.filter((s) => s.is_active) || []
  const completedSessions = sessions?.filter((s) => !s.is_active) || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>
              <p className="text-gray-600">Track and manage student attendance</p>
            </div>
            <Button asChild>
              <Link href="/dashboard/teacher">Back to Dashboard</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <p className="text-2xl font-bold text-green-600">{activeSessions.length}</p>
              <p className="text-sm text-gray-600">Active Sessions</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <p className="text-2xl font-bold text-blue-600">{sessions?.length || 0}</p>
              <p className="text-sm text-gray-600">Total Sessions</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <p className="text-2xl font-bold text-purple-600">{attendanceRecords?.length || 0}</p>
              <p className="text-sm text-gray-600">Check-ins Today</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-2xl font-bold text-orange-600">
                {analytics?.reduce((sum, a) => sum + a.attendance_rate, 0) / (analytics?.length || 1) || 0}%
              </p>
              <p className="text-sm text-gray-600">Avg Attendance</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="active" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="active">Active Sessions ({activeSessions.length})</TabsTrigger>
            <TabsTrigger value="recent">Recent Records ({attendanceRecords?.length || 0})</TabsTrigger>
            <TabsTrigger value="analytics">Analytics ({analytics?.length || 0})</TabsTrigger>
            <TabsTrigger value="history">Session History ({completedSessions.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {activeSessions.length > 0 ? (
              activeSessions.map((session) => (
                <Card key={session.id} className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                          <h3 className="font-semibold text-gray-900">{session.classes?.name}</h3>
                          <Badge variant="outline">{session.classes?.code}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          Started: {format(parseISO(session.start_time), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                        <p className="text-sm text-gray-500">
                          Session Date: {format(parseISO(session.session_date), "MMM d, yyyy")}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" asChild>
                          <Link href={`/dashboard/teacher/attendance/session/${session.id}`}>Manage</Link>
                        </Button>
                        <Button size="sm" variant="destructive" asChild>
                          <Link href={`/dashboard/teacher/attendance/end/${session.id}`}>End Session</Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-12 text-center">
                  <svg
                    className="w-16 h-16 text-gray-400 mx-auto mb-4"
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
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No active sessions</h3>
                  <p className="text-gray-600 mb-6">Start an attendance session for one of your classes.</p>
                  <Button asChild>
                    <Link href="/dashboard/teacher/classes">View Classes</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="recent" className="space-y-4">
            {attendanceRecords && attendanceRecords.length > 0 ? (
              <div className="grid gap-4">
                {attendanceRecords.slice(0, 20).map((record) => (
                  <Card key={record.id} className="border-0 shadow-md">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="font-medium text-gray-900">{record.student?.full_name}</h4>
                            <Badge variant="outline">{record.student?.student_id}</Badge>
                          </div>
                          <p className="text-sm text-gray-600">{record.session?.classes?.code}</p>
                          <p className="text-xs text-gray-500">
                            {format(parseISO(record.created_at), "MMM d, h:mm a")}
                            {record.check_in_method && ` • via ${record.check_in_method}`}
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
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-12 text-center">
                  <svg
                    className="w-16 h-16 text-gray-400 mx-auto mb-4"
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
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No recent attendance records</h3>
                  <p className="text-gray-600">Start taking attendance to see records here.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            {analytics && analytics.length > 0 ? (
              <div className="grid gap-4">
                {analytics.map((analytic) => (
                  <Card key={analytic.id} className="border-0 shadow-md">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-semibold text-gray-900">{analytic.student?.full_name}</h4>
                          <p className="text-sm text-gray-600">
                            {analytic.student?.student_id} • {analytic.classes?.code}
                          </p>
                        </div>
                        <Badge
                          variant={
                            analytic.attendance_rate >= 90
                              ? "default"
                              : analytic.attendance_rate >= 75
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {analytic.attendance_rate.toFixed(1)}%
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Attendance Rate</span>
                          <span>{analytic.attendance_rate.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${analytic.attendance_rate}%` }}
                          ></div>
                        </div>
                        <div className="grid grid-cols-4 gap-4 text-xs text-gray-600 mt-3">
                          <div className="text-center">
                            <p className="font-medium text-green-600">{analytic.present_sessions}</p>
                            <p>Present</p>
                          </div>
                          <div className="text-center">
                            <p className="font-medium text-yellow-600">{analytic.late_sessions}</p>
                            <p>Late</p>
                          </div>
                          <div className="text-center">
                            <p className="font-medium text-red-600">{analytic.absent_sessions}</p>
                            <p>Absent</p>
                          </div>
                          <div className="text-center">
                            <p className="font-medium text-gray-600">{analytic.total_sessions}</p>
                            <p>Total</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-12 text-center">
                  <svg
                    className="w-16 h-16 text-gray-400 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No analytics data yet</h3>
                  <p className="text-gray-600">Take attendance for a few sessions to see analytics.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {completedSessions.length > 0 ? (
              completedSessions.map((session) => (
                <Card key={session.id} className="border-0 shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900">{session.classes?.name}</h3>
                          <Badge variant="outline">{session.classes?.code}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          {format(parseISO(session.session_date), "MMM d, yyyy")}
                        </p>
                        <p className="text-sm text-gray-500">
                          {format(parseISO(session.start_time), "h:mm a")} -{" "}
                          {session.end_time ? format(parseISO(session.end_time), "h:mm a") : "Ongoing"}
                        </p>
                      </div>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/dashboard/teacher/attendance/session/${session.id}`}>View Details</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-12 text-center">
                  <svg
                    className="w-16 h-16 text-gray-400 mx-auto mb-4"
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
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No session history</h3>
                  <p className="text-gray-600">Complete some attendance sessions to see history.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
