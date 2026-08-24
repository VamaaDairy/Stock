import { NextRequest, NextResponse } from "next/server"
import { getUserByEmail, verifyPassword } from "@/lib/db/users"
import { createSession } from "@/lib/auth"

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()
  const user = await getUserByEmail(email)
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 })
  }
  const token = await createSession(user.id, user.email)
  const res = NextResponse.json({ success: true, name: user.name })
  res.cookies.set("session", token, { httpOnly: true, path: "/", maxAge: 60 * 60 * 24 * 7 })
  return res
}
