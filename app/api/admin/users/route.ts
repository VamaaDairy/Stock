import { NextRequest, NextResponse } from "next/server"
import { verifySession } from "@/lib/auth"
import {
  getAllUsers,
  createUser,
  updateUserRole,
  deleteUser,
  getUserByEmail,
  ensureUsersTable,
  type Role,
} from "@/lib/db/users"

const ADMIN_EMAIL = "darshan@vamaadairy.com"

async function requireAdmin(req: NextRequest) {
  const token = req.cookies.get("session")?.value
  if (!token) return null
  const payload = await verifySession(token)
  if (!payload || (payload.role !== "admin" && payload.email !== ADMIN_EMAIL)) return null
  return payload
}

// GET /api/admin/users — list all users (admin only)
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

  await ensureUsersTable()
  const users = await getAllUsers()
  return NextResponse.json({ success: true, users })
}

// POST /api/admin/users — create new user (admin only)
export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

  const { email, password, name, role } = await req.json()
  if (!email || !password || !name) {
    return NextResponse.json({ error: "email, password, name required" }, { status: 400 })
  }
  const validRoles: Role[] = ["admin", "manager", "viewer"]
  const assignedRole: Role = validRoles.includes(role) ? role : "viewer"

  await ensureUsersTable()
  const existing = await getUserByEmail(email)
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 })
  }

  await createUser(email, password, name, assignedRole)
  return NextResponse.json({ success: true })
}

// PATCH /api/admin/users — update user role
export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

  const { id, role } = await req.json()
  if (!id || !role) return NextResponse.json({ error: "id and role required" }, { status: 400 })

  const validRoles: Role[] = ["admin", "manager", "viewer"]
  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 })
  }

  await updateUserRole(Number(id), role)
  return NextResponse.json({ success: true })
}

// DELETE /api/admin/users — delete user
export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

  // Cannot delete yourself
  if (Number(id) === admin.userId) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 })
  }

  await deleteUser(Number(id))
  return NextResponse.json({ success: true })
}
