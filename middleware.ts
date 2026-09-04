import { NextRequest, NextResponse } from "next/server"
import { verifySession } from "@/lib/auth"

// Routes that never need auth
const PUBLIC_PATHS = ["/login", "/forgot-password", "/reset-password", "/api/"]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // 1. Immediately pass all static files, chunks, assets, and APIs
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/static") ||
    pathname.includes(".") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next()
  }

  // 2. Public auth UI routes
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password")
  ) {
    if (pathname.startsWith("/login") || pathname.startsWith("/forgot-password")) {
      const token = req.cookies.get("session")?.value
      if (token) {
        try {
          const payload = await verifySession(token)
          if (payload) {
            return NextResponse.redirect(new URL("/", req.url))
          }
        } catch {
          // invalid token — allow proceeding to login
        }
      }
    }
    return NextResponse.next()
  }

  // 3. All other UI routes — require auth
  const token = req.cookies.get("session")?.value
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  try {
    const payload = await verifySession(token)
    if (!payload) {
      const res = NextResponse.redirect(new URL("/login", req.url))
      res.cookies.set("session", "", { maxAge: 0, path: "/" })
      return res
    }
  } catch {
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
