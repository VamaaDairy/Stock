import { NextRequest, NextResponse } from "next/server"
import { verifySession } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const token = req.cookies.get("session")?.value
  if (!token) return NextResponse.json({ success: false }, { status: 401 })
  const payload = await verifySession(token)
  if (!payload) return NextResponse.json({ success: false }, { status: 401 })
  return NextResponse.json({ success: true, email: payload.email })
}
