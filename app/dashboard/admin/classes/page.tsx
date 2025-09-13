import { requireAdmin } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { format, parseISO } from "date-fns"

export default async function AdminClassesPage() {
  const profile = await requireAdmin()
  const supabase = await createClient()

  // Get all classes with related data
  const { data: classes } = await supabase
    .from("classes")
    .select(`
      *,
      teacher:teacher_id (full_name, email),
      class_enrollments (
        id,
        student:student_id (full_name, student_id)
      ),
      attendance_sessions (
        id,
        created_at,
        is_active
      )
    `)
    .order("created_at", { ascending: false })

  // Get enrollment counts
  const classesWithStats = classes?.map((classItem) => ({
    ...classItem,
    enrollmentCount: classItem.class_enrollments?.length || 0,
    sessionCount: classItem.attendance_sessions?.length || 0,
    activeSessionCount: classItem.attendance_sessions?.filter((s) => s.is_active).length || 0,
  }))

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Class Management</h1>
              <p className="text-gray-600">Manage all classes and their enrollments</p>
            </div>
            <div className="flex gap-3">
              <Button asChild>
                <Link href="/dashboard/admin/classes/new">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Class
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard/admin">Back to Dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <p className="text-2xl font-bold text-blue-600">{classes?.length || 0}</p>
              <p className="text-sm text-gray-600">Total Classes</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {classesWithStats?.reduce((sum, c) => sum + c.enrollmentCount, 0) || 0}
              </p>
              <p className="text-sm text-gray-600">Total Enrollments</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
              </div>
              <p className="text-2xl font-bold text-purple-600">
                {classesWithStats?.reduce((sum, c) => sum + c.activeSessionCount, 0) || 0}
              </p>
              <p className="text-sm text-gray-600">Active Sessions</p>
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
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <p className="text-2xl font-bold text-orange-600">
                {classesWithStats?.reduce((sum, c) => sum + c.sessionCount, 0) || 0}
              </p>
              <p className="text-sm text-gray-600">Total Sessions</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card className="border-0 shadow-lg mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input placeholder="Search classes by name, code, or department..." className="h-11" />
              </div>
              <Button className="md:w-auto">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Classes List */}
        {classesWithStats && classesWithStats.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {classesWithStats.map((classItem) => (
              <Card key={classItem.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg">{classItem.name}</CardTitle>
                        <Badge variant="outline">{classItem.code}</Badge>
                        {classItem.activeSessionCount > 0 && (
                          <Badge variant="default" className="bg-green-600">
                            {classItem.activeSessionCount} Active
                          </Badge>
                        )}
                      </div>
                      <CardDescription>{classItem.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Class Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Department</p>
                        <p className="font-medium">{classItem.department}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Year Level</p>
                        <p className="font-medium">{classItem.year_level}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Schedule</p>
                        <p className="font-medium">{classItem.schedule}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Room</p>
                        <p className="font-medium">{classItem.room || "TBA"}</p>
                      </div>
                    </div>

                    {/* Teacher Info */}
                    {classItem.teacher && (
                      <div className="pt-3 border-t">
                        <p className="text-sm text-gray-600">Teacher</p>
                        <p className="font-medium">{classItem.teacher.full_name}</p>
                        <p className="text-sm text-gray-500">{classItem.teacher.email}</p>
                      </div>
                    )}

                    {/* Stats */}
                    <div className="pt-3 border-t">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-lg font-bold text-blue-600">{classItem.enrollmentCount}</p>
                          <p className="text-xs text-gray-600">Students</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-green-600">{classItem.sessionCount}</p>
                          <p className="text-xs text-gray-600">Sessions</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-purple-600">{classItem.activeSessionCount}</p>
                          <p className="text-xs text-gray-600">Active</p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1 bg-transparent" asChild>
                        <Link href={`/dashboard/admin/classes/${classItem.id}`}>View Details</Link>
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 bg-transparent" asChild>
                        <Link href={`/dashboard/admin/classes/${classItem.id}/edit`}>Edit</Link>
                      </Button>
                    </div>

                    {/* Created Date */}
                    <div className="pt-2 text-xs text-gray-500">
                      Created: {format(parseISO(classItem.created_at), "MMM d, yyyy")}
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
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No classes found</h3>
              <p className="text-gray-600 mb-4">Get started by creating your first class.</p>
              <Button asChild>
                <Link href="/dashboard/admin/classes/new">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create First Class
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
