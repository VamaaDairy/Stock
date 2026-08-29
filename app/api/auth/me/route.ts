import { NextRequest, NextResponse } from "next/server"
import { verifySession } from "@/lib/auth"
import { getUserById } from "@/lib/db/users"

export async function GET(req: NextRequest) {
  const token = req.cookies.get("session")?.value
  if (!token) return NextResponse.json({ success: false }, { status: 401 })

  const payload = await verifySession(token)
  if (!payload) return NextResponse.json({ success: false }, { status: 401 })

  const user = await getUserById(payload.userId)
  if (!user) return NextResponse.json({ success: false }, { status: 401 })

  return NextResponse.json({
    success: true,
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  })
}
