// app/api/classes/[id]/route.ts
import { NextResponse } from "next/server"
import { createClient } from "@/lib/server"

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const classId = params.id

  const { data, error } = await supabase
    .from("classes")
    .select("*")
    .eq("id", classId)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}
