"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

interface Class {
  id: string
  name: string
  code: string
  description?: string
  department?: string
  semester?: number
  batch?: string
  credits?: number
  teacher?: {
    full_name: string
  } | null
}

export default function StudentClassesPage() {
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const supabase = createClient()

        // Get logged-in user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError) throw userError
        if (!user) {
          setClasses([])
          setLoading(false)
          return
        }

        // Query classes joined via enrollments
        const { data, error } = await supabase
          .from("class_enrollments")
          .select(
            `
            class:class_id (
              id,
              name,
              code,
              description,
              department,
              semester,
              batch,
              credits,
              teacher:teacher_id ( full_name )
            )
          `
          )
          .eq("student_id", user.id)

        if (error) throw error

        // Flatten "class" relation
        setClasses((data || []).map((row: any) => row.class))
      } catch (err) {
        console.error("Error fetching classes:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchClasses()
  }, [])

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">My Classes</h1>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="animate-spin h-5 w-5" />
          <span>Loading classes...</span>
        </div>
      ) : classes.length === 0 ? (
        <p className="text-muted-foreground">No classes assigned.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {classes.map((cls) => (
            <Card key={cls.id}>
              <CardHeader>
                <CardTitle>{cls.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <p>
                  <span className="font-medium">Code:</span> {cls.code}
                </p>
                <p>
                  <span className="font-medium">Department:</span>{" "}
                  {cls.department || "—"}
                </p>
                <p>
                  <span className="font-medium">Teacher:</span>{" "}
                  {cls.teacher?.full_name || "—"}
                </p>
                <p>
                  <span className="font-medium">Credits:</span>{" "}
                  {cls.credits || "—"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
