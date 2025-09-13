import { requireStudent } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { format } from "date-fns"

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

export default async function StudentSchedulePage() {
  const profile = await requireStudent()
  const supabase = await createClient()

  // Get student's enrolled classes
  const { data: enrollments } = await supabase.from("class_enrollments").select("class_id").eq("student_id", profile.id)

  const classIds = enrollments?.map((e) => e.class_id) || []

  // Get all schedules for enrolled classes
  const { data: schedules } = await supabase
    .from("schedules")
    .select(`
      *,
      classes:class_id (
        *,
        teacher:teacher_id (full_name)
      )
    `)
    .in("class_id", classIds)
    .order("day_of_week")
    .order("start_time")

  // Group schedules by day
  const schedulesByDay = DAYS.reduce(
    (acc, day, index) => {
      acc[day] = schedules?.filter((schedule) => schedule.day_of_week === index) || []
      return acc
    },
    {} as Record<string, any[]>,
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Schedule</h1>
              <p className="text-gray-600">Your weekly class schedule</p>
            </div>
            <Button asChild>
              <Link href="/dashboard/student">Back to Dashboard</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
          {DAYS.map((day) => (
            <Card key={day} className="border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-center">{day}</CardTitle>
                <CardDescription className="text-center">
                  {schedulesByDay[day].length} {schedulesByDay[day].length === 1 ? "class" : "classes"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {schedulesByDay[day].length > 0 ? (
                  schedulesByDay[day].map((schedule) => (
                    <div key={schedule.id} className="p-3 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-sm text-gray-900">{schedule.classes?.code}</h4>
                        <Badge variant="outline" className="text-xs">
                          {schedule.classes?.credits} credits
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-700 mb-1">{schedule.classes?.name}</p>
                      <p className="text-xs text-gray-600 mb-2">{schedule.classes?.teacher?.full_name}</p>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-blue-600">
                          {format(new Date(`2000-01-01T${schedule.start_time}`), "h:mm a")} -{" "}
                          {format(new Date(`2000-01-01T${schedule.end_time}`), "h:mm a")}
                        </span>
                        <span className="text-gray-500">Room: {schedule.room || "TBA"}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <svg
                      className="w-8 h-8 text-gray-400 mx-auto mb-2"
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
                    <p className="text-xs text-gray-500">No classes</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Summary Card */}
        <Card className="border-0 shadow-lg mt-8">
          <CardHeader>
            <CardTitle>Schedule Summary</CardTitle>
            <CardDescription>Overview of your weekly schedule</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <p className="text-2xl font-bold text-blue-600">{classIds.length}</p>
                <p className="text-sm text-gray-600">Total Classes</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <p className="text-2xl font-bold text-green-600">{schedules?.length || 0}</p>
                <p className="text-sm text-gray-600">Weekly Sessions</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                    />
                  </svg>
                </div>
                <p className="text-2xl font-bold text-purple-600">
                  {schedules?.reduce((sum, s) => sum + (s.classes?.credits || 0), 0) || 0}
                </p>
                <p className="text-sm text-gray-600">Total Credits</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
