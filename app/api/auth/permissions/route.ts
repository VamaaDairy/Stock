import { NextRequest, NextResponse } from "next/server"
import { verifySession } from "@/lib/auth"
import { getPermissionsForRole } from "@/lib/db/permissions"
import { ensurePermissionsTable } from "@/lib/db/permissions"

// GET /api/auth/permissions — returns permissions for the logged-in user's role
export async function GET(req: NextRequest) {
  const token = req.cookies.get("session")?.value
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const payload = await verifySession(token)
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  await ensurePermissionsTable()
  const permissions = await getPermissionsForRole(payload.role)
  return NextResponse.json({ success: true, role: payload.role, permissions })
}
