// app/api/classes/route.ts
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/server"

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return new Response(JSON.stringify({ error: "You must be logged in" }), { status: 401 })
    }

    // Fetch role from your `users` table
    const { data: userData, error: roleError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (roleError || !userData || userData.role !== "teacher") {
      return new Response(JSON.stringify({ error: "You must be a teacher" }), { status: 403 })
    }

    const body = await req.json()
    const { name, code, department, description, semester, batch } = body

    if (!name || !code || !department) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 })
    }

    const { data, error } = await supabase
      .from("classes")
      .insert([{ name, code, department, description, semester, batch }])
      .select()
      .single()

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }

    return new Response(JSON.stringify({ class: data }), { status: 201 })
  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 })
  }
}

            
export async function GET() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const teacher_id = user?.id
    if (!teacher_id) return NextResponse.json({ error: "Not logged in" }, { status: 401 })

    const { data, error } = await supabase
    .from("classes")
    .select("*")
    .eq("teacher_id", teacher_id)
    .order("created_at", { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json(data)
}
