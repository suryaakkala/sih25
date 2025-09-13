import { createClient } from "@/lib/supabase/server"
import type { Profile, UserRole } from "@/lib/types"
import { redirect } from "next/navigation"

export async function getCurrentUser(): Promise<Profile | null> {
  const supabase = await createClient()

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  const user = session?.user

  console.log("[v0] getCurrentUser - user:", user ? "found" : "not found")
  if (error) {
    console.log("[v0] getCurrentUser - auth error:", error.message)
  }

  if (error || !user) return null

  let profile = null
  let retries = 3

  while (retries > 0 && !profile) {
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (profileData) {
      profile = profileData
      console.log("[v0] Profile found:", profile.email, profile.role)
      break
    }

    if (profileError && profileError.code !== "PGRST116") {
      console.error("[v0] Profile fetch error:", profileError)
      break
    }

    // If profile doesn't exist, try to create it manually
    if (retries === 3) {
      console.log("[v0] Creating profile for user:", user.id)
      const { error: insertError } = await supabase.from("profiles").insert({
        id: user.id,
        email: user.email || "",
        full_name: user.user_metadata?.full_name || "New User",
        role: (user.user_metadata?.role as UserRole) || "student",
        student_id: user.user_metadata?.student_id || null,
        department: user.user_metadata?.department || null,
        year_level: user.user_metadata?.year_level || null,
      })

      if (insertError) {
        console.error("[v0] Profile creation error:", insertError)
      }
    }

    retries--
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }

  return profile
}

export async function requireAuth(allowedRoles?: UserRole[]) {
  const profile = await getCurrentUser()

  if (!profile) {
    redirect("/auth/login")
  }

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    redirect("/unauthorized")
  }

  return profile
}

export async function requireRole(role: UserRole) {
  return requireAuth([role])
}

export async function requireStudent() {
  return requireRole("student")
}

export async function requireTeacher() {
  return requireRole("teacher")
}

export async function requireAdmin() {
  return requireRole("admin")
}

export async function requireCounselor() {
  return requireRole("career_counselor")
}

export async function requireStaffOrAdmin() {
  return requireAuth(["teacher", "admin", "career_counselor"])
}
