// app/api/recommendations/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { generatePersonalizedRecommendations } from "@/lib/ai-recommendations"

export async function GET(request: NextRequest) {
  try {
    console.log("GET request received at /api/recommendations")
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!, 
      process.env.SUPABASE_SERVICE_ROLE_KEY!, 
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("Authorization error or user not found", authError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("User authenticated successfully", user.id)
    const recommendations = await generatePersonalizedRecommendations(user.id)
    console.log("Recommendations generated successfully", recommendations.length)

    // Ensure we return between 2-4 recommendations
    const finalRecommendations = recommendations.slice(0, 4)
    
    return NextResponse.json({ recommendations: finalRecommendations })
  } catch (error) {
    console.error("Error generating recommendations in GET handler:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!, 
      process.env.SUPABASE_SERVICE_ROLE_KEY!, 
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("Authorization error or user not found", authError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    console.log("Recommendation action received:", body)

    // Here you would typically store the user's action in your database
    // For now, we'll just return a success response
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error processing recommendation action:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}