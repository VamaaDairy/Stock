import { NextRequest, NextResponse } from "next/server"
import { getUserByEmail, createUser, ensureUsersTable } from "@/lib/db/users"
import { createSession } from "@/lib/auth"

export async function POST(req: NextRequest) {
  const { email, password, name, inviteCode } = await req.json()

  if (inviteCode !== process.env.SIGNUP_INVITE_CODE) {
    return NextResponse.json({ success: false, error: "Invalid invite code" }, { status: 403 })
  }
  if (!email || !password || !name) {
    return NextResponse.json({ success: false, error: "All fields required" }, { status: 400 })
  }

  await ensureUsersTable()
  const existing = await getUserByEmail(email)
  if (existing) {
    return NextResponse.json({ success: false, error: "Email already registered" }, { status: 409 })
  }

  await createUser(email, password, name)
  const user = await getUserByEmail(email)
  const token = await createSession(user!.id, user!.email)

  const res = NextResponse.json({ success: true })
  res.cookies.set("session", token, { httpOnly: true, path: "/", maxAge: 60 * 60 * 24 * 7 })
  return res
}
