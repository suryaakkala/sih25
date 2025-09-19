import { requireCounselor } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import UserMenu from "@/components/user-menu"

export default async function CounselorInterventionsPage() {
  const profile = await requireCounselor()
  const supabase = await createClient()

  // Get all students
  const { data: students } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "student")
    .order("created_at", { ascending: false })

  // Get student analytics for finding students needing intervention
  const { data: studentAnalytics } = await supabase
    .from("student_analytics")
    .select(`
      *,
      student:student_id (full_name, student_id, email, department, year_level, profile_image_url),
      classes:class_id (name, code)
    `)
    .order("attendance_rate", { ascending: true })

  // Get students with low attendance (need attention)
  const studentsNeedingAttention = studentAnalytics?.filter((s) => s.attendance_rate < 75) || []
  
  // Mock data for interventions (since there's no intervention table in the schema)
  // In a real application, you would have an interventions table
  const mockInterventions = [
    {
      id: "1",
      student_id: studentsNeedingAttention[0]?.student_id || "default-id",
      student: studentsNeedingAttention[0]?.student || {
        full_name: "John Doe",
        student_id: "ST12345",
        email: "john.doe@example.com",
        department: "Computer Science",
        year_level: 2,
        profile_image_url: "/placeholder-user.jpg"
      },
      type: "attendance",
      status: "scheduled",
      scheduled_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
      notes: "Student has missed 5 consecutive classes. Schedule an initial meeting to understand the issues.",
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      counselor_id: profile.id,
      follow_up_required: true
    },
    {
      id: "2",
      student_id: studentsNeedingAttention[1]?.student_id || "default-id-2",
      student: studentsNeedingAttention[1]?.student || {
        full_name: "Jane Smith",
        student_id: "ST67890",
        email: "jane.smith@example.com",
        department: "Electrical Engineering",
        year_level: 3,
        profile_image_url: "/placeholder-user.jpg"
      },
      type: "academic",
      status: "in_progress",
      scheduled_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      notes: "Student's task completion rate has dropped significantly. Initial meeting conducted, follow-up required for academic planning.",
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      counselor_id: profile.id,
      follow_up_required: true
    },
    {
      id: "3",
      student_id: "some-student-id-3",
      student: {
        full_name: "Michael Johnson",
        student_id: "ST24680",
        email: "michael.johnson@example.com",
        department: "Mechanical Engineering",
        year_level: 2,
        profile_image_url: "/placeholder-user.jpg"
      },
      type: "personal",
      status: "completed",
      scheduled_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
      notes: "Student requested personal counseling due to family issues affecting academic performance. Provided guidance and resources.",
      created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
      counselor_id: profile.id,
      follow_up_required: false,
      resolution: "Student is feeling better and has a support plan in place. Will check in next month."
    },
    {
      id: "4",
      student_id: "some-student-id-4",
      student: {
        full_name: "Sarah Williams",
        student_id: "ST13579",
        email: "sarah.williams@example.com",
        department: "Information Technology",
        year_level: 4,
        profile_image_url: "/placeholder-user.jpg"
      },
      type: "career",
      status: "scheduled",
      scheduled_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days from now
      notes: "Senior student requesting career guidance. Schedule comprehensive session for resume review and interview preparation.",
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      counselor_id: profile.id,
      follow_up_required: true
    },
    {
      id: "5",
      student_id: "some-student-id-5",
      student: {
        full_name: "David Brown",
        student_id: "ST97531",
        email: "david.brown@example.com",
        department: "Computer Science",
        year_level: 3,
        profile_image_url: "/placeholder-user.jpg"
      },
      type: "attendance",
      status: "completed",
      scheduled_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      notes: "Student had attendance issues due to part-time job scheduling conflicts. Worked with professors to find accommodations.",
      created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(), // 12 days ago
      counselor_id: profile.id,
      follow_up_required: true,
      resolution: "Created modified attendance plan with professors. Student will check in bi-weekly.",
      follow_up_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // 14 days from now
    }
  ]

  // Filter interventions by status
  const scheduledInterventions = mockInterventions.filter(i => i.status === "scheduled")
  const inProgressInterventions = mockInterventions.filter(i => i.status === "in_progress")
  const completedInterventions = mockInterventions.filter(i => i.status === "completed")

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Student Interventions</h1>
              <p className="text-gray-600">Manage student support and counseling sessions</p>
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
              <UserMenu user={profile} />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Action buttons */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex items-center gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Create New Intervention
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Create New Intervention</DialogTitle>
                  <DialogDescription>
                    Schedule a new counseling session or intervention for a student.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="student" className="text-right text-sm font-medium">
                      Student
                    </label>
                    <div className="col-span-3">
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a student" />
                        </SelectTrigger>
                        <SelectContent>
                          {students?.map((student) => (
                            <SelectItem key={student.id} value={student.id}>
                              {student.full_name} ({student.student_id})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="type" className="text-right text-sm font-medium">
                      Type
                    </label>
                    <div className="col-span-3">
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select intervention type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="attendance">Attendance</SelectItem>
                          <SelectItem value="academic">Academic Performance</SelectItem>
                          <SelectItem value="personal">Personal</SelectItem>
                          <SelectItem value="career">Career Guidance</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="date" className="text-right text-sm font-medium">
                      Date & Time
                    </label>
                    <div className="col-span-3">
                      <Input type="datetime-local" />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="notes" className="text-right text-sm font-medium">
                      Notes
                    </label>
                    <div className="col-span-3">
                      <Textarea 
                        placeholder="Enter details about the intervention, including reason, goals, and any preparation needed."
                        rows={4}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Schedule Intervention</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <Button variant="outline">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              Filter Interventions
            </Button>
          </div>
          
          <div className="relative w-full md:w-auto">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <Input 
              className="pl-10 border-gray-300 w-full md:w-64" 
              placeholder="Search interventions..."
            />
          </div>
        </div>

        {/* Intervention Tabs */}
        <Tabs defaultValue="scheduled" className="mb-8">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="scheduled">
              Scheduled ({scheduledInterventions.length})
            </TabsTrigger>
            <TabsTrigger value="in-progress">
              In Progress ({inProgressInterventions.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({completedInterventions.length})
            </TabsTrigger>
            <TabsTrigger value="at-risk">
              Students At Risk ({studentsNeedingAttention.length})
            </TabsTrigger>
          </TabsList>
          
          {/* Scheduled Interventions Tab */}
          <TabsContent value="scheduled">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {scheduledInterventions.map((intervention) => (
                <Card key={intervention.id} className="border-0 shadow-lg overflow-hidden">
                  <CardHeader className="bg-blue-50 border-b border-blue-100 pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <Badge className="mb-2 bg-blue-100 text-blue-800 hover:bg-blue-200">
                          {intervention.type.charAt(0).toUpperCase() + intervention.type.slice(1)}
                        </Badge>
                        <CardTitle className="text-lg">Meeting with {intervention.student.full_name}</CardTitle>
                        <CardDescription>
                          {new Date(intervention.scheduled_date).toLocaleDateString()} at{" "}
                          {new Date(intervention.scheduled_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </CardDescription>
                      </div>
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={intervention.student.profile_image_url} />
                        <AvatarFallback>{intervention.student.full_name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="flex items-center text-sm">
                        <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
                          />
                        </svg>
                        Student ID: {intervention.student.student_id}
                      </div>
                      <div className="flex items-center text-sm">
                        <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                        {intervention.student.email}
                      </div>
                      <div className="flex items-center text-sm">
                        <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                          />
                        </svg>
                        {intervention.student.department}, Year {intervention.student.year_level}
                      </div>
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Notes:</h4>
                        <p className="text-sm text-gray-600">{intervention.notes}</p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t bg-gray-50 flex justify-between">
                    <Button variant="outline" size="sm">
                      Send Reminder
                    </Button>
                    <div className="space-x-2">
                      <Button variant="outline" size="sm">
                        Reschedule
                      </Button>
                      <Button size="sm">
                        Start Session
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          {/* In Progress Interventions Tab */}
          <TabsContent value="in-progress">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {inProgressInterventions.map((intervention) => (
                <Card key={intervention.id} className="border-0 shadow-lg overflow-hidden">
                  <CardHeader className="bg-purple-50 border-b border-purple-100 pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <Badge className="mb-2 bg-purple-100 text-purple-800 hover:bg-purple-200">
                          {intervention.type.charAt(0).toUpperCase() + intervention.type.slice(1)}
                        </Badge>
                        <CardTitle className="text-lg">Ongoing: {intervention.student.full_name}</CardTitle>
                        <CardDescription>
                          Started on {new Date(intervention.scheduled_date).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={intervention.student.profile_image_url} />
                        <AvatarFallback>{intervention.student.full_name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="flex items-center text-sm">
                        <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
                          />
                        </svg>
                        Student ID: {intervention.student.student_id}
                      </div>
                      <div className="flex items-center text-sm">
                        <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                          />
                        </svg>
                        {intervention.student.department}, Year {intervention.student.year_level}
                      </div>
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Progress Notes:</h4>
                        <p className="text-sm text-gray-600">{intervention.notes}</p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t bg-gray-50 flex justify-between">
                    <Button variant="outline" size="sm">
                      Add Notes
                    </Button>
                    <div className="space-x-2">
                      <Button variant="outline" size="sm">
                        Schedule Follow-up
                      </Button>
                      <Button size="sm">
                        Complete Intervention
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          {/* Completed Interventions Tab */}
          <TabsContent value="completed">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {completedInterventions.map((intervention) => (
                <Card key={intervention.id} className="border-0 shadow-lg overflow-hidden">
                  <CardHeader className="bg-green-50 border-b border-green-100 pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <Badge className="mb-2 bg-green-100 text-green-800 hover:bg-green-200">
                          {intervention.type.charAt(0).toUpperCase() + intervention.type.slice(1)}
                        </Badge>
                        <CardTitle className="text-lg">Completed: {intervention.student.full_name}</CardTitle>
                        <CardDescription>
                          Completed on {new Date(intervention.scheduled_date).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={intervention.student.profile_image_url} />
                        <AvatarFallback>{intervention.student.full_name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="flex items-center text-sm">
                        <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
                          />
                        </svg>
                        Student ID: {intervention.student.student_id}
                      </div>
                      <div className="flex items-center text-sm">
                        <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                          />
                        </svg>
                        {intervention.student.department}, Year {intervention.student.year_level}
                      </div>
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Resolution:</h4>
                        <p className="text-sm text-gray-600">{intervention.resolution || "No resolution provided"}</p>
                      </div>
                      {intervention.follow_up_required && intervention.follow_up_date && (
                        <div className="mt-2">
                          <h4 className="text-sm font-medium text-gray-700 mb-1">Follow-up Date:</h4>
                          <p className="text-sm text-gray-600">
                            {new Date(intervention.follow_up_date).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="border-t bg-gray-50 flex justify-between">
                    <Button variant="outline" size="sm">
                      View Full Report
                    </Button>
                    {intervention.follow_up_required && (
                      <Button variant="outline" size="sm">
                        Schedule Follow-up
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          {/* Students At Risk Tab */}
          <TabsContent value="at-risk">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {studentsNeedingAttention.map((analytic) => (
                <Card key={analytic.id} className="border-0 shadow-lg overflow-hidden">
                  <CardHeader className="bg-red-50 border-b border-red-100 pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <Badge variant="destructive" className="mb-2">
                          {analytic.attendance_rate.toFixed(1)}% Attendance
                        </Badge>
                        <CardTitle className="text-lg">{analytic.student?.full_name}</CardTitle>
                        <CardDescription>
                          {analytic.student?.department}, Year {analytic.student?.year_level}
                        </CardDescription>
                      </div>
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={analytic.student?.profile_image_url || "/placeholder-user.jpg"} />
                        <AvatarFallback>{analytic.student?.full_name.substring(0, 2).toUpperCase() || "NA"}</AvatarFallback>
                      </Avatar>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="flex items-center text-sm">
                        <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
                          />
                        </svg>
                        Student ID: {analytic.student?.student_id}
                      </div>
                      <div className="flex items-center text-sm">
                        <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                        {analytic.student?.email}
                      </div>
                      <div className="flex items-center text-sm">
                        <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        Course: {analytic.classes?.name} ({analytic.classes?.code})
                      </div>
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Attendance Statistics:</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span>Present</span>
                            <span>{analytic.present_sessions} / {analytic.total_sessions} sessions</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full" 
                              style={{ width: `${(analytic.present_sessions / analytic.total_sessions) * 100}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span>Absent</span>
                            <span>{analytic.absent_sessions} / {analytic.total_sessions} sessions</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-red-500 h-2 rounded-full" 
                              style={{ width: `${(analytic.absent_sessions / analytic.total_sessions) * 100}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span>Late</span>
                            <span>{analytic.late_sessions} / {analytic.total_sessions} sessions</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-yellow-500 h-2 rounded-full" 
                              style={{ width: `${(analytic.late_sessions / analytic.total_sessions) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t bg-gray-50 flex justify-between">
                    <Button variant="outline" size="sm">
                      Send Email
                    </Button>
                    <div className="space-x-2">
                      <Button variant="outline" size="sm">
                        Call Student
                      </Button>
                      <Button size="sm">
                        Schedule Intervention
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}