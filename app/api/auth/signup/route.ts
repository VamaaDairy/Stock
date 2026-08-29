import { NextResponse } from "next/server"

// Public signup is disabled. Users are created by the admin via Settings page (/api/admin/users).
export async function POST() {
  return NextResponse.json(
    { success: false, error: "Public signup is disabled. Contact your admin." },
    { status: 403 }
  )
}
