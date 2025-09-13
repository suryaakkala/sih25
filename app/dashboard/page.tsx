import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  console.log("[v0] Dashboard page accessed")

  const user = await getCurrentUser()
  console.log("[v0] Current user:", user)

  if (!user) {
    console.log("[v0] No user found, redirecting to login")
    redirect("/auth/login")
  }

  console.log("[v0] User role:", user.role)

  switch (user.role) {
    case "student":
      console.log("[v0] Redirecting to student dashboard")
      redirect("/dashboard/student")
      return
    case "teacher":
      console.log("[v0] Redirecting to teacher dashboard")
      redirect("/dashboard/teacher")
      return
    case "admin":
      console.log("[v0] Redirecting to admin dashboard")
      redirect("/dashboard/admin")
      return
    case "career_counselor":
      console.log("[v0] Redirecting to counselor dashboard")
      redirect("/dashboard/counselor")
      return
    default:
      console.log("[v0] Unknown role, redirecting to unauthorized")
      redirect("/unauthorized")
      return
  }
}
