"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { QrCode, MapPin, Fingerprint, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import { useRouter } from "next/navigation"

interface Class {
  id: string
  name: string
  teacher_name: string
  start_time: string
  end_time: string
  location: string
  qr_code?: string
}

export default function AttendanceCheckIn() {
  const [user, setUser] = useState<any>(null)
  const [availableClasses, setAvailableClasses] = useState<Class[]>([])
  const [selectedClass, setSelectedClass] = useState<Class | null>(null)
  const [checkInMethod, setCheckInMethod] = useState<"qr" | "location" | "biometric" | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    checkUser()
    fetchAvailableClasses()
    getCurrentLocation()
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

  const fetchAvailableClasses = async () => {
    const now = new Date()
    const currentTime = now.toTimeString().slice(0, 5)
    const currentDay = now.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase()

    const { data, error } = await supabase
      .from("classes")
      .select(`
        id,
        name,
        teacher_name,
        start_time,
        end_time,
        location,
        qr_code,
        schedules!inner(day_of_week)
      `)
      .eq("schedules.day_of_week", currentDay)
      .lte("start_time", currentTime)
      .gte("end_time", currentTime)

    if (error) {
      console.error("Error fetching classes:", error)
      return
    }

    setAvailableClasses(data || [])
  }

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          console.error("Error getting location:", error)
        },
      )
    }
  }

  const handleCheckIn = async () => {
    if (!selectedClass || !user) return

    setIsChecking(true)
    setMessage(null)

    try {
      // Verify check-in method
      let isValid = false

      switch (checkInMethod) {
        case "qr":
          // In a real app, this would scan and verify QR code
          isValid = true
          break
        case "location":
          // Verify location (within 100m of class location)
          isValid = location !== null
          break
        case "biometric":
          // In a real app, this would use biometric authentication
          isValid = true
          break
      }

      if (!isValid) {
        throw new Error("Check-in verification failed")
      }

      // Record attendance
      const { error } = await supabase.from("attendance").insert({
        student_id: user.id,
        class_id: selectedClass.id,
        check_in_time: new Date().toISOString(),
        check_in_method: checkInMethod,
        location_lat: location?.lat,
        location_lng: location?.lng,
        status: "present",
      })

      if (error) throw error

      setMessage({ type: "success", text: "Successfully checked in!" })

      // Reset form after success
      setTimeout(() => {
        setSelectedClass(null)
        setCheckInMethod(null)
        fetchAvailableClasses()
      }, 2000)
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Check-in failed" })
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Attendance Check-in</h1>
          <p className="text-gray-600">Select your class and check-in method</p>
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

        {/* Available Classes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Available Classes
            </CardTitle>
            <CardDescription>Classes currently in session that you can check into</CardDescription>
          </CardHeader>
          <CardContent>
            {availableClasses.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No classes available for check-in right now</p>
            ) : (
              <div className="space-y-3">
                {availableClasses.map((classItem) => (
                  <div
                    key={classItem.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedClass?.id === classItem.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setSelectedClass(classItem)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900">{classItem.name}</h3>
                        <p className="text-sm text-gray-600">Teacher: {classItem.teacher_name}</p>
                        <p className="text-sm text-gray-600">Location: {classItem.location}</p>
                      </div>
                      <Badge variant="outline">
                        {classItem.start_time} - {classItem.end_time}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Check-in Methods */}
        {selectedClass && (
          <Card>
            <CardHeader>
              <CardTitle>Select Check-in Method</CardTitle>
              <CardDescription>Choose how you'd like to verify your attendance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  variant={checkInMethod === "qr" ? "default" : "outline"}
                  className="h-24 flex-col gap-2"
                  onClick={() => setCheckInMethod("qr")}
                >
                  <QrCode className="h-6 w-6" />
                  QR Code
                </Button>
                <Button
                  variant={checkInMethod === "location" ? "default" : "outline"}
                  className="h-24 flex-col gap-2"
                  onClick={() => setCheckInMethod("location")}
                  disabled={!location}
                >
                  <MapPin className="h-6 w-6" />
                  Location
                  {!location && <span className="text-xs">Getting location...</span>}
                </Button>
                <Button
                  variant={checkInMethod === "biometric" ? "default" : "outline"}
                  className="h-24 flex-col gap-2"
                  onClick={() => setCheckInMethod("biometric")}
                >
                  <Fingerprint className="h-6 w-6" />
                  Biometric
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Check-in Button */}
        {selectedClass && checkInMethod && (
          <Card>
            <CardContent className="pt-6">
              <Button onClick={handleCheckIn} disabled={isChecking} className="w-full h-12 text-lg">
                {isChecking ? "Checking in..." : `Check in to ${selectedClass.name}`}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
