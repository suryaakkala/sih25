import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { generatePersonalizedRecommendations, trackRecommendationInteraction } from "@/components/ai-recommendations"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    })

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const recommendations = await generatePersonalizedRecommendations(user.id)

    return NextResponse.json({ recommendations })
  } catch (error) {
    console.error("Error generating recommendations:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    })

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { recommendationId, action } = await request.json()

    if (!recommendationId || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    await trackRecommendationInteraction(user.id, recommendationId, action)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error tracking recommendation interaction:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
