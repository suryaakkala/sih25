"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function EditUserPage() {
  const params = useParams()
  const router = useRouter()
  const [form, setForm] = useState({ full_name: "", email: "", role: "student" })

  useEffect(() => {
    fetch(`/api/admin/users/${params.id}`)
      .then((res) => res.json())
      .then((data) => setForm(data))
  }, [params.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetch(`/api/admin/users/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    router.push("/dashboard/admin/users")
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <Input
        placeholder="Full name"
        value={form.full_name}
        onChange={(e) => setForm({ ...form, full_name: e.target.value })}
      />
      <Input
        placeholder="Email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />
      <select
        value={form.role}
        onChange={(e) => setForm({ ...form, role: e.target.value })}
        className="border rounded p-2 w-full"
      >
        <option value="student">Student</option>
        <option value="teacher">Teacher</option>
        <option value="admin">Admin</option>
        <option value="career_counselor">Career Counselor</option>
      </select>
      <Button type="submit">Update</Button>
    </form>
  )
}
