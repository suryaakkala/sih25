"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function CreateClassPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: "",
    code: "",
    department: "",
    description: "",
    semester: "",
    batch: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Failed to create class")
      } else {
        alert("Class created successfully!")
        router.push("/dashboard/teacher/classes") // redirect after success
      }
    } catch (err) {
      setError("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Create New Class</h1>
      {error && <p className="text-red-500 mb-2">{error}</p>}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input name="name" placeholder="Class Name" value={form.name} onChange={handleChange} required />
        <input name="code" placeholder="Class Code" value={form.code} onChange={handleChange} required />
        <input name="department" placeholder="Department" value={form.department} onChange={handleChange} required />
        <textarea name="description" placeholder="Description" value={form.description} onChange={handleChange} />
        <input name="semester" placeholder="Semester" value={form.semester} onChange={handleChange} />
        <input name="batch" placeholder="Batch" value={form.batch} onChange={handleChange} />
        <button type="submit" disabled={loading} className="bg-blue-600 text-white p-2 rounded">
          {loading ? "Creating..." : "Create Class"}
        </button>
      </form>
    </div>
  )
}
