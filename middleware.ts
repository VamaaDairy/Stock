import { NextRequest, NextResponse } from "next/server"

// Auth completely removed - all routes are public
export async function middleware(req: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [],
}
