import { requireCounselor } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import UserMenu from "@/components/user-menu"

export default async function CounselorReportsPage() {
  const profile = await requireCounselor()
  const supabase = await createClient()

  // Get all students for analytics
  const { data: students } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "student")
    .order("created_at", { ascending: false })

  // Get student analytics data
  const { data: studentAnalytics } = await supabase
    .from("student_analytics")
    .select(`
      *,
      student:student_id (full_name, student_id, email, department, year_level),
      classes:class_id (name, code)
    `)

  // Get all departments for filtering
  const departmentSet = new Set<string>()
  students?.forEach((student) => {
    if (student.department) {
      departmentSet.add(student.department)
    }
  })
  const departments = Array.from(departmentSet)

  // Calculate overall analytics
  const totalStudents = students?.length || 0
  const avgAttendanceRate =
    studentAnalytics?.reduce((sum, s) => sum + s.attendance_rate, 0) / (studentAnalytics?.length || 1) || 0
  const avgTaskCompletion =
    studentAnalytics?.reduce((sum, s) => sum + s.task_completion_rate, 0) / (studentAnalytics?.length || 1) || 0
  
  // Calculate department-wise statistics
  const departmentStats = [...departmentSet].map(dept => {
    const deptStudents = students?.filter(s => s.department === dept) || []
    const deptAnalytics = studentAnalytics?.filter(a => 
      students?.find(s => s.id === a.student_id && s.department === dept)) || []
    
    const avgDeptAttendance = deptAnalytics.length > 0
      ? deptAnalytics.reduce((sum, a) => sum + a.attendance_rate, 0) / deptAnalytics.length
      : 0
    
    const avgDeptTaskCompletion = deptAnalytics.length > 0
      ? deptAnalytics.reduce((sum, a) => sum + a.task_completion_rate, 0) / deptAnalytics.length
      : 0
    
    const atRiskCount = deptAnalytics.filter(a => a.attendance_rate < 75).length
    
    return {
      department: dept,
      studentCount: deptStudents.length,
      avgAttendance: avgDeptAttendance,
      avgTaskCompletion: avgDeptTaskCompletion,
      atRiskCount
    }
  })

  // Year-wise statistics
  const yearLevels = [1, 2, 3, 4]
  const yearStats = yearLevels.map(year => {
    const yearStudents = students?.filter(s => s.year_level === year) || []
    const yearAnalytics = studentAnalytics?.filter(a => 
      students?.find(s => s.id === a.student_id && s.year_level === year)) || []
    
    const avgYearAttendance = yearAnalytics.length > 0
      ? yearAnalytics.reduce((sum, a) => sum + a.attendance_rate, 0) / yearAnalytics.length
      : 0
    
    const avgYearTaskCompletion = yearAnalytics.length > 0
      ? yearAnalytics.reduce((sum, a) => sum + a.task_completion_rate, 0) / yearAnalytics.length
      : 0
    
    const atRiskCount = yearAnalytics.filter(a => a.attendance_rate < 75).length
    
    return {
      year,
      studentCount: yearStudents.length,
      avgAttendance: avgYearAttendance,
      avgTaskCompletion: avgYearTaskCompletion,
      atRiskCount
    }
  })

  // Attendance trend data (simulated - in a real app this would come from the database)
  // In a real implementation, you would calculate this from actual attendance records
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const attendanceTrend = months.map((month, index) => {
    // Create mock data for the current academic year
    const baseRate = 82 // Base attendance rate
    const seasonalVariation = Math.sin((index / 11) * Math.PI) * 8 // Seasonal variation
    const randomVariation = (Math.random() * 5) - 2.5 // Random variation between -2.5 and 2.5
    
    let rate = baseRate + seasonalVariation + randomVariation
    // Ensure the rate is between 0 and 100
    rate = Math.max(0, Math.min(100, rate))
    
    return {
      month,
      attendanceRate: rate
    }
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Counseling Reports</h1>
              <p className="text-gray-600">Analytics and insights for student success</p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/counselor">
                  Dashboard
                </Link>
              </Button>
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
                  Students
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
        {/* Report filters */}
        <div className="mb-8 flex flex-col md:flex-row gap-4 bg-white p-4 rounded-lg shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time Period</label>
              <Select defaultValue="current">
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Current Semester</SelectItem>
                  <SelectItem value="previous">Previous Semester</SelectItem>
                  <SelectItem value="year">Academic Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <Select defaultValue="all">
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year Level</label>
              <Select defaultValue="all">
                <SelectTrigger>
                  <SelectValue placeholder="Select year level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Year Levels</SelectItem>
                  <SelectItem value="1">First Year</SelectItem>
                  <SelectItem value="2">Second Year</SelectItem>
                  <SelectItem value="3">Third Year</SelectItem>
                  <SelectItem value="4">Fourth Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-end">
            <Button className="w-full md:w-auto">Generate Report</Button>
          </div>
        </div>

        {/* Overview Cards */}
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
                  <p className="text-sm font-medium text-gray-600">At Risk Students</p>
                  <p className="text-2xl font-bold text-red-600">
                    {studentAnalytics?.filter(a => a.attendance_rate < 75).length || 0}
                  </p>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Attendance Chart */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Attendance Trend</CardTitle>
              <CardDescription>Average attendance rate by month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 w-full">
                {/* In a real implementation, you would use a chart library like Chart.js, Recharts, or ApexCharts */}
                <div className="flex h-64 items-end space-x-2">
                  {attendanceTrend.map((item, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <div 
                        className="w-8 bg-blue-500 rounded-t" 
                        style={{ height: `${item.attendanceRate * 0.6}%` }}
                      ></div>
                      <div className="text-xs mt-2 text-gray-600">{item.month}</div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Department Comparison */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Department Comparison</CardTitle>
              <CardDescription>Attendance and task completion by department</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b">
                      <th className="pb-2 text-sm font-medium text-gray-500">Department</th>
                      <th className="pb-2 text-sm font-medium text-gray-500">Students</th>
                      <th className="pb-2 text-sm font-medium text-gray-500">Avg. Attendance</th>
                      <th className="pb-2 text-sm font-medium text-gray-500">Task Completion</th>
                      <th className="pb-2 text-sm font-medium text-gray-500">At Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departmentStats.map((dept, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="py-3 text-sm font-medium">{dept.department}</td>
                        <td className="py-3 text-sm">{dept.studentCount}</td>
                        <td className="py-3 text-sm">
                          <div className="flex items-center">
                            <div 
                              className={`h-2 w-16 mr-2 rounded-full ${
                                dept.avgAttendance >= 90 ? "bg-green-500" : 
                                dept.avgAttendance >= 75 ? "bg-yellow-500" : "bg-red-500"
                              }`}
                              style={{ width: `${dept.avgAttendance}%`, maxWidth: "100px" }}
                            ></div>
                            <span>{dept.avgAttendance.toFixed(1)}%</span>
                          </div>
                        </td>
                        <td className="py-3 text-sm">
                          <div className="flex items-center">
                            <div 
                              className={`h-2 w-16 mr-2 rounded-full ${
                                dept.avgTaskCompletion >= 90 ? "bg-green-500" : 
                                dept.avgTaskCompletion >= 70 ? "bg-yellow-500" : "bg-red-500"
                              }`}
                              style={{ width: `${dept.avgTaskCompletion}%`, maxWidth: "100px" }}
                            ></div>
                            <span>{dept.avgTaskCompletion.toFixed(1)}%</span>
                          </div>
                        </td>
                        <td className="py-3 text-sm">
                          <span className={`${dept.atRiskCount > 0 ? "text-red-600 font-medium" : "text-gray-600"}`}>
                            {dept.atRiskCount}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Year Level Performance */}
        <Card className="border-0 shadow-lg mb-8">
          <CardHeader>
            <CardTitle>Year Level Performance</CardTitle>
            <CardDescription>Academic metrics by year level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b">
                    <th className="pb-2 text-sm font-medium text-gray-500">Year Level</th>
                    <th className="pb-2 text-sm font-medium text-gray-500">Students</th>
                    <th className="pb-2 text-sm font-medium text-gray-500">Avg. Attendance</th>
                    <th className="pb-2 text-sm font-medium text-gray-500">Task Completion</th>
                    <th className="pb-2 text-sm font-medium text-gray-500">At Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {yearStats.map((year, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-3 text-sm font-medium">Year {year.year}</td>
                      <td className="py-3 text-sm">{year.studentCount}</td>
                      <td className="py-3 text-sm">
                        <div className="flex items-center">
                          <div 
                            className={`h-2 w-16 mr-2 rounded-full ${
                              year.avgAttendance >= 90 ? "bg-green-500" : 
                              year.avgAttendance >= 75 ? "bg-yellow-500" : "bg-red-500"
                            }`}
                            style={{ width: `${year.avgAttendance}%`, maxWidth: "100px" }}
                          ></div>
                          <span>{year.avgAttendance.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="py-3 text-sm">
                        <div className="flex items-center">
                          <div 
                            className={`h-2 w-16 mr-2 rounded-full ${
                              year.avgTaskCompletion >= 90 ? "bg-green-500" : 
                              year.avgTaskCompletion >= 70 ? "bg-yellow-500" : "bg-red-500"
                            }`}
                            style={{ width: `${year.avgTaskCompletion}%`, maxWidth: "100px" }}
                          ></div>
                          <span>{year.avgTaskCompletion.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="py-3 text-sm">
                        <span className={`${year.atRiskCount > 0 ? "text-red-600 font-medium" : "text-gray-600"}`}>
                          {year.atRiskCount}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Export Options */}
        <div className="flex justify-end gap-4 mb-8">
          <Button variant="outline">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Export CSV
          </Button>
          <Button variant="outline">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Export PDF
          </Button>
          <Button>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh Data
          </Button>
        </div>
      </div>
    </div>
  )
}