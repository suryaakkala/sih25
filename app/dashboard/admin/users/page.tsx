import { requireAdmin } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { format, parseISO } from "date-fns"

export default async function AdminUsersPage() {
  const profile = await requireAdmin()
  const supabase = await createClient()

  // Get all users with their profiles
  const { data: allUsers } = await supabase.from("profiles").select("*").order("created_at", { ascending: false })

  const students = allUsers?.filter((user) => user.role === "student") || []
  const teachers = allUsers?.filter((user) => user.role === "teacher") || []
  const admins = allUsers?.filter((user) => user.role === "admin") || []
  const counselors = allUsers?.filter((user) => user.role === "career_counselor") || []

  const UserCard = ({ user }: { user: any }) => (
    <Card key={user.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-gray-900">{user.full_name}</h3>
              <Badge
                variant={
                  user.role === "admin"
                    ? "destructive"
                    : user.role === "teacher"
                      ? "default"
                      : user.role === "career_counselor"
                        ? "secondary"
                        : "outline"
                }
              >
                {user.role.replace("_", " ")}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mb-1">{user.email}</p>
            {user.student_id && <p className="text-sm text-gray-600 mb-1">ID: {user.student_id}</p>}
            {user.department && <p className="text-sm text-gray-600 mb-1">Dept: {user.department}</p>}
            {user.year_level && <p className="text-sm text-gray-600 mb-1">Year: {user.year_level}</p>}
            <p className="text-xs text-gray-500">Joined: {format(parseISO(user.created_at), "MMM d, yyyy")}</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" asChild>
              <Link href={`/dashboard/admin/users/${user.id}`}>View</Link>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link href={`/dashboard/admin/users/${user.id}/edit`}>Edit</Link>
            </Button>
          </div>
        </div>
        {user.phone_number && (
          <div className="pt-3 border-t">
            <p className="text-xs text-gray-500">Phone: {user.phone_number}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
              <p className="text-gray-600">Manage all system users and their roles</p>
            </div>
            <div className="flex gap-3">
              <Button asChild>
                <Link href="/dashboard/admin/users/new">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add User
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
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <p className="text-2xl font-bold text-blue-600">{students.length}</p>
              <p className="text-sm text-gray-600">Students</p>
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
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <p className="text-2xl font-bold text-green-600">{teachers.length}</p>
              <p className="text-sm text-gray-600">Teachers</p>
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
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <p className="text-2xl font-bold text-purple-600">{admins.length}</p>
              <p className="text-sm text-gray-600">Admins</p>
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
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-2xl font-bold text-orange-600">{counselors.length}</p>
              <p className="text-sm text-gray-600">Counselors</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card className="border-0 shadow-lg mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input placeholder="Search users by name, email, or ID..." className="h-11" />
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

        {/* Users Tabs */}
        <Tabs defaultValue="students" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="students">Students ({students.length})</TabsTrigger>
            <TabsTrigger value="teachers">Teachers ({teachers.length})</TabsTrigger>
            <TabsTrigger value="admins">Admins ({admins.length})</TabsTrigger>
            <TabsTrigger value="counselors">Counselors ({counselors.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="students" className="space-y-4">
            {students.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {students.map((user) => (
                  <UserCard key={user.id} user={user} />
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
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
                  <p className="text-gray-600">Students will appear here once they register.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="teachers" className="space-y-4">
            {teachers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teachers.map((user) => (
                  <UserCard key={user.id} user={user} />
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
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No teachers found</h3>
                  <p className="text-gray-600">Teachers will appear here once they register.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="admins" className="space-y-4">
            {admins.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {admins.map((user) => (
                  <UserCard key={user.id} user={user} />
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
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No other admins found</h3>
                  <p className="text-gray-600">Additional administrators will appear here.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="counselors" className="space-y-4">
            {counselors.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {counselors.map((user) => (
                  <UserCard key={user.id} user={user} />
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
                      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No counselors found</h3>
                  <p className="text-gray-600">Career counselors will appear here once they register.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
