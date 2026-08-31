import { NextResponse } from "next/server"
import { syncAndGetExpiredStock } from "@/lib/db/expiry"

export async function GET() {
  try {
    const data = await syncAndGetExpiredStock()
    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error("Expired stock API error:", err)
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
