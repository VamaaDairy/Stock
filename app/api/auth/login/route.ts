import { NextRequest, NextResponse } from "next/server"
import { getUserByEmail, ensureUsersTable, verifyPassword } from "@/lib/db/users"
import { createSession } from "@/lib/auth"

const ADMIN_EMAIL = "darshan@vamaadairy.com"

export async function POST(req: NextRequest) {
  await ensureUsersTable()

  const { email, password } = await req.json()
  if (!email || !password) {
    return NextResponse.json({ success: false, error: "Email and password required" }, { status: 400 })
  }

  const user = await getUserByEmail(email)
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 })
  }

  // Force admin role for the admin email always
  const cleanEmail = email.trim().toLowerCase()
  const role = cleanEmail === ADMIN_EMAIL.toLowerCase() ? "admin" : user.role

  const token = await createSession(user.id, user.email, role)
  const res = NextResponse.json({ success: true, name: user.name, role })
  res.cookies.set("session", token, { httpOnly: true, path: "/", maxAge: 60 * 60 * 24 * 7, sameSite: "lax" })
  return res
}
