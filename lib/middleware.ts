import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  console.log("[v0] Middleware executing for:", request.nextUrl.pathname)

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  const user = session?.user

  console.log("[v0] User in middleware:", user ? "authenticated" : "not authenticated")
  if (error) {
    console.log("[v0] Auth error in middleware:", error.message)
  }

  const isAuthPage = request.nextUrl.pathname.startsWith("/auth")
  const isHomePage = request.nextUrl.pathname === "/"

  if (!user && !isAuthPage && !isHomePage) {
    console.log("[v0] Redirecting to login - no user found")
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  if (user && isAuthPage) {
    console.log("[v0] Redirecting authenticated user away from auth pages")
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
