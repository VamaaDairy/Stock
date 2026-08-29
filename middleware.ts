import { NextRequest, NextResponse } from "next/server"
import { verifySession } from "@/lib/auth"

// Routes that never need auth
const PUBLIC_PATHS = ["/login", "/api/"]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // APIs are always free — for VBA macros
  if (pathname.startsWith("/api/")) {
    return NextResponse.next()
  }

  // Public UI routes
  if (pathname.startsWith("/login")) {
    // If already logged in, redirect to dashboard
    const token = req.cookies.get("session")?.value
    if (token) {
      const payload = await verifySession(token)
      if (payload) {
        return NextResponse.redirect(new URL("/dashboard", req.url))
      }
    }
    return NextResponse.next()
  }

  // All other UI routes — require auth
  const token = req.cookies.get("session")?.value
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  const payload = await verifySession(token)
  if (!payload) {
    const res = NextResponse.redirect(new URL("/login", req.url))
    res.cookies.set("session", "", { maxAge: 0, path: "/" })
    return res
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     * - _next/static
     * - _next/image
     * - favicon.ico
     * - public assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
