import { requireTeacher } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function TeacherClassesPage() {
  const profile = await requireTeacher()
  const supabase = await createClient()

  // Get teacher's classes with enrollment counts
  const { data: classes } = await supabase.from("classes").select("*").eq("teacher_id", profile.id)

  // Get enrollment counts for each class
  const classIds = classes?.map((c) => c.id) || []
  const { data: enrollments } = await supabase.from("class_enrollments").select("class_id").in("class_id", classIds)

  const enrollmentsByClass = enrollments?.reduce(
    (acc, enrollment) => {
      acc[enrollment.class_id] = (acc[enrollment.class_id] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Classes</h1>
              <p className="text-gray-600">Manage your courses and students</p>
            </div>
            <div className="flex gap-3">
              <Button asChild>
                <Link href="/dashboard/teacher/classes/new">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New Class
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard/teacher">Back to Dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
                {Object.values(enrollmentsByClass || {}).reduce((sum, count) => sum + count, 0)}
              </p>
              <p className="text-sm text-gray-600">Total Students</p>
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
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                  />
                </svg>
              </div>
              <p className="text-2xl font-bold text-purple-600">
                {classes?.reduce((sum, c) => sum + c.credits, 0) || 0}
              </p>
              <p className="text-sm text-gray-600">Total Credits</p>
            </CardContent>
          </Card>
        </div>

        {/* Classes Grid */}
        {classes && classes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((classItem) => (
              <Card key={classItem.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{classItem.code}</CardTitle>
                      <CardDescription className="mt-1">{classItem.name}</CardDescription>
                    </div>
                    <Badge variant="outline">{classItem.credits} credits</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {classItem.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">{classItem.description}</p>
                    )}

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Students enrolled:</span>
                      <span className="font-medium">{enrollmentsByClass?.[classItem.id] || 0}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Max capacity:</span>
                      <span className="font-medium">{classItem.max_students}</span>
                    </div>

                    {classItem.department && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Department:</span>
                        <span className="font-medium">{classItem.department}</span>
                      </div>
                    )}

                    <div className="flex gap-2 pt-4">
                      <Button size="sm" className="flex-1" asChild>
                        <Link href={`/dashboard/teacher/classes/${classItem.id}`}>Manage</Link>
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/dashboard/teacher/attendance/start/${classItem.id}`}>Start Session</Link>
                      </Button>
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">No classes yet</h3>
              <p className="text-gray-600 mb-6">Create your first class to start managing students and attendance.</p>
              <Button asChild>
                <Link href="/dashboard/teacher/classes/new">
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
