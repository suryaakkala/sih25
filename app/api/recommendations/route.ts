import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { generatePersonalizedRecommendations } from "@/lib/ai-recommendations"

// Add debug logs to trace the flow and identify issues
export async function GET(request: NextRequest) {
  try {
    console.log("GET request received at /api/recommendations")
    const cookieStore = await cookies()
    const resolvedCookies = await cookieStore
    console.log("Cookies fetched successfully in GET handler", resolvedCookies)

    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get(name: string) {
          return resolvedCookies.get(name)?.value
        },
      },
    })

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("Authorization error or user not found", authError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("User authenticated successfully", user)
    const recommendations = await generatePersonalizedRecommendations(user.id)
    console.log("Recommendations generated successfully", recommendations)

    return NextResponse.json({ recommendations })
  } catch (error) {
    console.error("Error generating recommendations in GET handler:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies() // Await cookies()
    const resolvedCookies = await cookieStore // Resolve the promise
    console.log("Cookies fetched successfully in POST handler")

    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get(name: string) {
          return resolvedCookies.get(name)?.value // Access resolved cookies
        },
      },
    })

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("Authorization error or user not found", authError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("User authenticated successfully", user)
    const body = await request.json()
    console.log("Request body received", body)

    const recommendations = await generatePersonalizedRecommendations(user.id)
    console.log("Recommendations generated successfully", recommendations)

    return NextResponse.json({ recommendations })
  } catch (error) {
    console.error("Error generating recommendations in POST handler:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
