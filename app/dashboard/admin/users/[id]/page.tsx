"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function UserDetail() {
  const params = useParams()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    fetch(`/api/admin/users/${params.id}`)
      .then((res) => res.json())
      .then((data) => setUser(data))
  }, [params.id])

  if (!user) return <p>Loading...</p>

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{user.full_name}</h1>
      <p>Email: {user.email}</p>
      <p>Role: {user.role}</p>

      <Link href={`/dashboard/admin/users/${user.id}/edit`}>
        <Button>Edit</Button>
      </Link>
    </div>
  )
}
