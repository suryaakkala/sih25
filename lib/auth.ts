// FILE: lib/auth.ts

import { createClient } from "@/lib/supabase/server"
import type { Profile, UserRole } from "@/lib/types"
import { redirect } from "next/navigation"

export async function getCurrentUser(): Promise<Profile | null> {
  const supabase = await createClient()

  // First, get the session and the authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log("[v0] getCurrentUser - user:", user ? "found" : "not found")

  if (!user) {
    return null
  }

  // Next, fetch the user's profile from the 'profiles' table.
  // The trigger in your SQL ensures this profile will exist for new users.
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (profileError) {
    console.error("[v0] Profile fetch error:", profileError.message)
    return null
  }

  console.log("[v0] Profile found:", profile.email, profile.role)
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