"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { QrCode, Users, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import { useRouter } from "next/navigation"

interface Class {
  id: string
  name: string
  location: string
}

interface AttendanceSession {
  id: string
  class_id: string
  qr_code: string
  is_active: boolean
  created_at: string
}

export default function GenerateQR() {
  const [user, setUser] = useState<any>(null)
  const [classes, setClasses] = useState<Class[]>([])
  const [selectedClassId, setSelectedClassId] = useState<string>("")
  const [activeSession, setActiveSession] = useState<AttendanceSession | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    checkUser()
    fetchClasses()
  }, [])

  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push("/auth/login")
      return
    }

    // Check if user is a teacher
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (profile?.role !== "teacher") {
      router.push("/unauthorized")
      return
    }

    setUser(user)
  }

  const fetchClasses = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase.from("classes").select("id, name, location").eq("teacher_id", user.id)

    if (error) {
      console.error("Error fetching classes:", error)
      return
    }

    setClasses(data || [])
  }

  const generateQRCode = async () => {
    if (!selectedClassId) return

    setIsGenerating(true)
    setMessage(null)

    try {
      // End any existing active session for this class
      await supabase
        .from("attendance_sessions")
        .update({ is_active: false })
        .eq("class_id", selectedClassId)
        .eq("is_active", true)

      // Generate new session
      const sessionId = `session_${Date.now()}`
      const qrData = `class_${selectedClassId}_${sessionId}`

      const { data: session, error } = await supabase
        .from("attendance_sessions")
        .insert({
          id: sessionId,
          class_id: selectedClassId,
          teacher_id: user.id,
          qr_code: qrData,
          is_active: true,
          expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
        })
        .select()
        .single()

      if (error) throw error

      setActiveSession(session)
      setMessage({ type: "success", text: "QR code generated successfully!" })
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to generate QR code" })
    } finally {
      setIsGenerating(false)
    }
  }

  const endSession = async () => {
    if (!activeSession) return

    try {
      await supabase.from("attendance_sessions").update({ is_active: false }).eq("id", activeSession.id)

      setActiveSession(null)
      setMessage({ type: "success", text: "Attendance session ended" })
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to end session" })
    }
  }

  const selectedClass = classes.find((c) => c.id === selectedClassId)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Generate QR Code</h1>
          <p className="text-gray-600">Create a QR code for student attendance</p>
        </div>

        {message && (
          <Alert className={message.type === "success" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
            {message.type === "success" ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={message.type === "success" ? "text-green-800" : "text-red-800"}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        {/* Class Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Select Class
            </CardTitle>
            <CardDescription>Choose the class for which you want to generate a QR code</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((classItem) => (
                  <SelectItem key={classItem.id} value={classItem.id}>
                    {classItem.name} - {classItem.location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedClass && !activeSession && (
              <div className="mt-4">
                <Button onClick={generateQRCode} disabled={isGenerating} className="w-full">
                  {isGenerating ? "Generating..." : "Generate QR Code"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active QR Code */}
        {activeSession && selectedClass && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-green-600" />
                Active QR Code
                <Badge variant="secondary" className="ml-auto">
                  <Clock className="h-3 w-3 mr-1" />
                  30 min
                </Badge>
              </CardTitle>
              <CardDescription>Students can scan this QR code to check in to {selectedClass.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                {/* QR Code Display */}
                <div className="w-64 h-64 mx-auto bg-white border-2 border-gray-200 rounded-lg flex items-center justify-center">
                  {/* In a real app, you would use a QR code library like qrcode.js */}
                  <div className="text-center">
                    <QrCode className="h-32 w-32 text-gray-400 mx-auto mb-2" />
                    <p className="text-xs text-gray-500 font-mono break-all px-4">{activeSession.qr_code}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-lg font-semibold text-gray-900">{selectedClass.name}</p>
                  <p className="text-sm text-gray-600">Location: {selectedClass.location}</p>
                  <p className="text-sm text-gray-600">
                    Session started: {new Date(activeSession.created_at).toLocaleTimeString()}
                  </p>
                </div>

                <Button onClick={endSession} variant="destructive" className="w-full">
                  End Attendance Session
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="text-center">
          <Button variant="outline" onClick={() => router.push("/dashboard/teacher")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
