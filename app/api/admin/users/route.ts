import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(req: Request) {
  await requireAdmin()
  const { email, full_name, role, password } = await req.json()

  if (!email || !full_name || !role || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }

  const supabaseAdmin = createAdminClient()

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, role },
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data.user)
}
