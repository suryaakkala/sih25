import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default async function HomePage() {
  const user = await getCurrentUser()

  if (user) {
    // Redirect authenticated users to their appropriate dashboard
    switch (user.role) {
      case "student":
        redirect("/dashboard/student")
      case "teacher":
        redirect("/dashboard/teacher")
      case "admin":
        redirect("/dashboard/admin")
      case "career_counselor":
        redirect("/dashboard/counselor")
      default:
        redirect("/dashboard")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Hero Section */}
      <div className="container mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <div className="mx-auto w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mb-8">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6 text-balance">
            Smart Attendance & Student Productivity System
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto text-pretty">
            Revolutionize education with AI-powered attendance tracking, personalized task management, and comprehensive
            analytics for students, teachers, and administrators.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="h-12 px-8 bg-blue-600 hover:bg-blue-700">
              <Link href="/auth/login">Sign In</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 px-8 bg-transparent">
              <Link href="/auth/signup">Create Account</Link>
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <CardTitle className="text-xl">Smart Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-600">
                Multiple check-in methods including QR codes, geolocation, and facial recognition for seamless
                attendance tracking.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <CardTitle className="text-xl">AI Personalization</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-600">
                Intelligent task recommendations and personalized learning paths based on attendance patterns and
                performance.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <CardTitle className="text-xl">Advanced Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-600">
                Comprehensive dashboards with real-time insights for students, teachers, and administrators.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <CardTitle className="text-xl">Role-Based Access</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-600">
                Tailored experiences for students, teachers, administrators, and career counselors with appropriate
                permissions.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-5 5v-5zM4.828 4.828A4 4 0 015.5 4H9v1H5.5a3 3 0 00-2.121.879l-.707-.707zM15 4h3.5a3 3 0 012.121.879l.707-.707A4 4 0 0018.5 3H15v1zm5 9.172V9h-1v4.172l.707.707.293-.293V9h1v4.172l-.707.707L20 13.172z"
                  />
                </svg>
              </div>
              <CardTitle className="text-xl">Real-time Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-600">
                Instant alerts for attendance updates, task deadlines, and important announcements.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <CardTitle className="text-xl">Secure & Reliable</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-600">
                Enterprise-grade security with role-based permissions and data protection compliance.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="border-0 shadow-xl bg-gradient-to-r from-blue-600 to-green-600 text-white">
            <CardHeader>
              <CardTitle className="text-3xl font-bold mb-4">Ready to Get Started?</CardTitle>
              <CardDescription className="text-blue-100 text-lg">
                Join thousands of educational institutions already using our smart attendance system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild size="lg" variant="secondary" className="h-12 px-8">
                <Link href="/auth/signup">Create Your Account Today</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
