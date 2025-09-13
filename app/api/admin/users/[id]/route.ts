import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth"

interface Params {
  params: { id: string }
}

// GET /api/admin/users/:id
export async function GET(req: Request, { params }: Params) {
  const profile = await requireAdmin()
  const supabase = await createClient()

  const { data, error } = await supabase.from("profiles").select("*").eq("id", params.id).single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// PUT /api/admin/users/:id
export async function PUT(req: Request, { params }: Params) {
  const profile = await requireAdmin()
  const supabase = await createClient()
  const body = await req.json()

  const { full_name, email, role } = body

  const { data, error } = await supabase
    .from("profiles")
    .update({ full_name, email, role, updated_at: new Date().toISOString() })
    .eq("id", params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE /api/admin/users/:id
export async function DELETE(req: Request, { params }: Params) {
  const profile = await requireAdmin()
  const supabase = await createClient()

  const { error } = await supabase.from("profiles").delete().eq("id", params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
