import { NextRequest, NextResponse } from "next/server"
import { verifySession } from "@/lib/auth"

const PROTECTED = ["/profile"]
const PUBLIC = ["/login", "/signup","/dashboard", "/production", "/demand", "/sales", "/products", "/settings","/"]

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname
  const token = req.cookies.get("session")?.value
  const session = token ? await verifySession(token) : null

  // Home "/" -> just gate it, don't redirect to /dashboard
  if (path === "/") {
    if (!session) return NextResponse.redirect(new URL("/login", req.url))
    return NextResponse.next()
  }

  // Already logged in, trying to hit login/signup -> send home
  if (PUBLIC.some(p => path.startsWith(p)) && session) {
    return NextResponse.redirect(new URL("/", req.url))
  }

  // Protected routes without session -> login
  if (PROTECTED.some(p => path.startsWith(p)) && !session) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/production/:path*", "/demand/:path*", "/sales/:path*", "/products/:path*", "/settings/:path*", "/profile/:path*", "/login", "/signup"],
}
