"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface Class {
  id: string
  name: string
  code: string
  department?: string
  credits: number
  max_students: number
}

export default function TeacherClassesPage() {
  const router = useRouter()
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const fetchClasses = async () => {
    setLoading(true)
    const res = await fetch("/api/classes")
    const data = await res.json()
    if (!res.ok) setError(data.error || "Failed to fetch classes")
    else setClasses(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchClasses()
  }, [])

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Classes</h1>
        <Button onClick={() => router.push("/dashboard/teacher/classes/new")}>
          + Create New Class
        </Button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && classes.length === 0 && <p>No classes found.</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.map(cls => (
          <div key={cls.id} className="border rounded p-4 shadow">
            <h2 className="text-xl font-semibold">{cls.name}</h2>
            <p className="text-sm text-gray-500">Code: {cls.code}</p>
            {cls.department && <p>Department: {cls.department}</p>}
            <p>Credits: {cls.credits}</p>
            <p>Max Students: {cls.max_students}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
