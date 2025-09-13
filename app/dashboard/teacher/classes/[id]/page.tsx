"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"

export default function ClassPage() {
  const params = useParams()
  const classId = params.id
  const [classData, setClassData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!classId) return

    fetch(`/api/classes/${classId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setError(data.error)
        else setClassData(data)
      })
      .catch(() => setError("Failed to fetch class"))
      .finally(() => setLoading(false))
  }, [classId])

  if (loading) return <p>Loading...</p>
  if (error) return <p className="text-red-500">{error}</p>

  return (
    <div>
      <h1 className="text-2xl font-bold">{classData?.name}</h1>
      <p>Code: {classData?.code}</p>
      <p>Department: {classData?.department}</p>
      <p>Semester: {classData?.semester}</p>
      <p>Batch: {classData?.batch}</p>
      <p>Description: {classData?.description}</p>
    </div>
  )
}
