"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Camera, X, CheckCircle, AlertCircle } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import { useRouter } from "next/navigation"

export default function QRScanner() {
  const [isScanning, setIsScanning] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [user, setUser] = useState<any>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push("/auth/login")
      return
    }
    setUser(user)
  }

  const startScanning = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsScanning(true)

        // Start QR code detection
        detectQRCode()
      }
    } catch (error) {
      setMessage({ type: "error", text: "Camera access denied or not available" })
    }
  }

  const stopScanning = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }
    setIsScanning(false)
  }

  const detectQRCode = () => {
    // In a real implementation, you would use a QR code detection library
    // like jsQR or qr-scanner. For this demo, we'll simulate QR detection
    const interval = setInterval(() => {
      if (!isScanning) {
        clearInterval(interval)
        return
      }

      // Simulate QR code detection after 3 seconds
      setTimeout(() => {
        if (isScanning) {
          handleQRDetected("class_123_session_456")
          clearInterval(interval)
        }
      }, 3000)
    }, 100)
  }

  const handleQRDetected = async (qrData: string) => {
    try {
      // Parse QR code data (format: class_id_session_id)
      const [, classId, sessionId] = qrData.split("_")

      if (!classId || !sessionId) {
        throw new Error("Invalid QR code format")
      }

      // Verify the QR code and record attendance
      const { data: session, error: sessionError } = await supabase
        .from("attendance_sessions")
        .select("*, classes(*)")
        .eq("id", sessionId)
        .eq("class_id", classId)
        .eq("is_active", true)
        .single()

      if (sessionError || !session) {
        throw new Error("Invalid or expired QR code")
      }

      // Check if already checked in
      const { data: existingAttendance } = await supabase
        .from("attendance")
        .select("id")
        .eq("student_id", user.id)
        .eq("session_id", sessionId)
        .single()

      if (existingAttendance) {
        throw new Error("Already checked in to this session")
      }

      // Record attendance
      const { error: attendanceError } = await supabase.from("attendance").insert({
        student_id: user.id,
        class_id: classId,
        session_id: sessionId,
        check_in_time: new Date().toISOString(),
        check_in_method: "qr",
        status: "present",
      })

      if (attendanceError) throw attendanceError

      setMessage({
        type: "success",
        text: `Successfully checked in to ${session.classes.name}!`,
      })

      stopScanning()

      // Redirect after success
      setTimeout(() => {
        router.push("/dashboard/student")
      }, 2000)
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "QR code processing failed" })
      stopScanning()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">QR Scanner</h1>
          <p className="text-gray-600">Scan the QR code displayed by your teacher</p>
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-blue-600" />
              Camera Scanner
            </CardTitle>
            <CardDescription>Position the QR code within the camera frame</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {!isScanning ? (
                <div className="text-center">
                  <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                    <Camera className="h-16 w-16 text-gray-400" />
                  </div>
                  <Button onClick={startScanning} className="w-full">
                    Start Camera
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-64 bg-black rounded-lg object-cover" />
                  <canvas ref={canvasRef} className="hidden" />
                  <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-white rounded-lg"></div>
                  </div>
                  <Button onClick={stopScanning} variant="destructive" size="sm" className="absolute top-2 right-2">
                    <X className="h-4 w-4" />
                  </Button>
                  <div className="absolute bottom-2 left-2 right-2 text-center">
                    <p className="text-white text-sm bg-black bg-opacity-50 rounded px-2 py-1">
                      Scanning for QR code...
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button variant="outline" onClick={() => router.push("/attendance/check-in")}>
            Back to Check-in Options
          </Button>
        </div>
      </div>
    </div>
  )
}
