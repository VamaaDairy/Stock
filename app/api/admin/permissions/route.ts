import { NextRequest, NextResponse } from "next/server"
import { verifySession } from "@/lib/auth"
import {
  getAllPermissions,
  setPermission,
  ensurePermissionsTable,
  type PageKey,
} from "@/lib/db/permissions"
import type { Role } from "@/lib/db/users"

const ADMIN_EMAIL = "darshan@vamaadairy.com"

async function requireAdmin(req: NextRequest) {
  const token = req.cookies.get("session")?.value
  if (!token) return null
  const payload = await verifySession(token)
  if (!payload || (payload.role !== "admin" && payload.email !== ADMIN_EMAIL)) return null
  return payload
}

// GET /api/admin/permissions — get all role permissions
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

  await ensurePermissionsTable()
  const permissions = await getAllPermissions()
  return NextResponse.json({ success: true, permissions })
}

// PATCH /api/admin/permissions — update a single permission
export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

  const { role, page, canAccess } = await req.json()
  if (!role || !page || typeof canAccess !== "boolean") {
    return NextResponse.json({ error: "role, page, canAccess required" }, { status: 400 })
  }

  // Admin role always keeps settings access — cannot be removed
  if (role === "admin" && page === "settings") {
    return NextResponse.json({ error: "Cannot remove settings access from admin" }, { status: 400 })
  }

  await setPermission(role as Role, page as PageKey, canAccess)
  return NextResponse.json({ success: true })
}
