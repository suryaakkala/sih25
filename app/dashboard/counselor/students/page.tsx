import { requireCounselor } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Filter, Search, AlertTriangle, CheckCircle, X } from "lucide-react"
import UserMenu from "@/components/user-menu"

export default async function CounselorStudentsPage() {
  const profile = await requireCounselor()
  const supabase = await createClient()

  // Get all students
  const { data: students } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "student")
    .order("created_at", { ascending: false })

  // Get student analytics
  const { data: studentAnalytics } = await supabase
    .from("student_analytics")
    .select(`
      *,
      student:student_id (full_name, student_id, email, department, year_level, profile_image_url),
      classes:class_id (name, code)
    `)
    .order("attendance_rate", { ascending: true })

  // Get data for at-risk students (below 75% attendance)
  const atRiskStudents = studentAnalytics?.filter((s) => s.attendance_rate < 75) || []

  // Get data for students with missing tasks
  const lowTaskCompletionStudents = studentAnalytics?.filter((s) => s.task_completion_rate < 70) || []

  // Get recent tasks assigned to students
  const { data: recentTasks } = await supabase
    .from("tasks")
    .select(`
      *,
      assignedTo:assigned_to (full_name, student_id, profile_image_url),
      classes:class_id (name, code)
    `)
    .order("created_at", { ascending: false })
    .limit(20)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Student Management</h1>
              <p className="text-gray-600">Track and support your students</p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/counselor">
                  Dashboard
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/counselor/reports">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Reports
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/counselor/interventions">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                    />
                  </svg>
                  Interventions
                </Link>
              </Button>
              <UserMenu user={profile} />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Search and filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input 
              placeholder="Search students by name, ID, or department..." 
              className="pl-10 border-gray-300 focus:border-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="text-gray-700">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
            <Button variant="default" size="sm">
              Export Data
            </Button>
          </div>
        </div>

        {/* Student Analytics Tabs */}
        <Tabs defaultValue="all" className="mb-8">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="all">All Students ({students?.length || 0})</TabsTrigger>
            <TabsTrigger value="at-risk">
              At Risk Students ({atRiskStudents.length})
            </TabsTrigger>
            <TabsTrigger value="low-completion">
              Low Task Completion ({lowTaskCompletionStudents.length})
            </TabsTrigger>
            <TabsTrigger value="recent-activity">Recent Activity</TabsTrigger>
          </TabsList>
          
          {/* All Students Tab */}
          <TabsContent value="all">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Year Level</th>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance</th>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Task Completion</th>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {students?.map((student) => {
                      const analytics = studentAnalytics?.find((a) => a.student_id === student.id)
                      
                      return (
                        <tr key={student.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Avatar className="h-8 w-8 mr-3">
                                <AvatarImage src={student.profile_image_url || "/placeholder-user.jpg"} />
                                <AvatarFallback>{student.full_name.substring(0, 2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium text-gray-900">{student.full_name}</div>
                                <div className="text-sm text-gray-500">{student.student_id || "No ID"}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {student.department || "Not assigned"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {student.year_level || "Not assigned"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {analytics ? (
                              <div className="flex items-center">
                                <div 
                                  className={`h-2.5 rounded-full w-16 mr-2 ${
                                    analytics.attendance_rate >= 90 
                                      ? "bg-green-500" 
                                      : analytics.attendance_rate >= 75 
                                      ? "bg-yellow-500" 
                                      : "bg-red-500"
                                  }`}
                                >
                                  <div 
                                    className="h-2.5 rounded-full bg-green-500" 
                                    style={{ width: `${analytics.attendance_rate}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm text-gray-700">{analytics.attendance_rate.toFixed(1)}%</span>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">No data</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {analytics ? (
                              <div className="flex items-center">
                                <div 
                                  className={`h-2.5 rounded-full w-16 mr-2 ${
                                    analytics.task_completion_rate >= 90 
                                      ? "bg-green-500" 
                                      : analytics.task_completion_rate >= 70 
                                      ? "bg-yellow-500" 
                                      : "bg-red-500"
                                  }`}
                                >
                                  <div 
                                    className="h-2.5 rounded-full bg-green-500" 
                                    style={{ width: `${analytics.task_completion_rate}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm text-gray-700">{analytics.task_completion_rate.toFixed(1)}%</span>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">No data</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex space-x-2">
                              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800">
                                View Profile
                              </Button>
                              <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-800">
                                Schedule Meeting
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
          
          {/* At Risk Students Tab */}
          <TabsContent value="at-risk">
            {atRiskStudents.length > 0 ? (
              <div className="space-y-4">
                {atRiskStudents.map((analytic) => (
                  <Alert key={analytic.id} variant="destructive" className="bg-red-50 border-red-200">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <div className="flex justify-between items-center w-full">
                      <div>
                        <AlertTitle className="text-red-800 flex items-center gap-2">
                          {analytic.student?.full_name}
                          <Badge variant="destructive" className="text-xs">
                            {analytic.attendance_rate.toFixed(1)}% Attendance
                          </Badge>
                        </AlertTitle>
                        <AlertDescription className="text-red-700">
                          <div className="flex flex-col gap-1 mt-1">
                            <span>ID: {analytic.student?.student_id} • {analytic.student?.department} • Year {analytic.student?.year_level}</span>
                            <span>Course: {analytic.classes?.name} ({analytic.classes?.code})</span>
                            <span>Missed {analytic.absent_sessions} of {analytic.total_sessions} classes</span>
                          </div>
                        </AlertDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-100">
                          Contact Student
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-100">
                          Create Intervention
                        </Button>
                      </div>
                    </div>
                  </Alert>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No at-risk students</h3>
                <p className="mt-1 text-gray-500">All students currently have attendance rates above 75%.</p>
              </div>
            )}
          </TabsContent>
          
          {/* Low Task Completion Tab */}
          <TabsContent value="low-completion">
            {lowTaskCompletionStudents.length > 0 ? (
              <div className="space-y-4">
                {lowTaskCompletionStudents.map((analytic) => (
                  <Alert key={analytic.id} className="bg-yellow-50 border-yellow-200">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <div className="flex justify-between items-center w-full">
                      <div>
                        <AlertTitle className="text-yellow-800 flex items-center gap-2">
                          {analytic.student?.full_name}
                          <Badge variant="outline" className="text-xs border-yellow-300 bg-yellow-100 text-yellow-800">
                            {analytic.task_completion_rate.toFixed(1)}% Task Completion
                          </Badge>
                        </AlertTitle>
                        <AlertDescription className="text-yellow-700">
                          <div className="flex flex-col gap-1 mt-1">
                            <span>ID: {analytic.student?.student_id} • {analytic.student?.department} • Year {analytic.student?.year_level}</span>
                            <span>Course: {analytic.classes?.name} ({analytic.classes?.code})</span>
                            <span>Average Task Score: {analytic.average_task_score.toFixed(1)}%</span>
                          </div>
                        </AlertDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="text-yellow-600 border-yellow-200 hover:bg-yellow-100">
                          Review Tasks
                        </Button>
                        <Button size="sm" variant="outline" className="text-yellow-600 border-yellow-200 hover:bg-yellow-100">
                          Schedule Meeting
                        </Button>
                      </div>
                    </div>
                  </Alert>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No students with low task completion</h3>
                <p className="mt-1 text-gray-500">All students currently have task completion rates above 70%.</p>
              </div>
            )}
          </TabsContent>
          
          {/* Recent Activity Tab */}
          <TabsContent value="recent-activity">
            <div className="space-y-4">
              {recentTasks?.map((task) => (
                <Card key={task.id} className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10 mt-1">
                          <AvatarImage src={task.assignedTo?.profile_image_url || "/placeholder-user.jpg"} />
                          <AvatarFallback>{task.assignedTo?.full_name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-gray-900">{task.assignedTo?.full_name}</h3>
                            <Badge 
                              variant={
                                task.status === "completed" 
                                  ? "default" 
                                  : task.status === "in_progress" 
                                  ? "outline" 
                                  : task.status === "overdue" 
                                  ? "destructive"
                                  : "secondary"
                              }
                              className="text-xs"
                            >
                              {task.status === "in_progress" ? "In Progress" : 
                               task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                            </Badge>
                            {task.priority === "urgent" && (
                              <Badge variant="destructive" className="text-xs">Urgent</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            Task: {task.title} {task.classes && `• ${task.classes.name} (${task.classes.code})`}
                          </p>
                          {task.due_date && (
                            <p className="text-xs text-gray-500 mt-1">
                              Due: {new Date(task.due_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(task.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}