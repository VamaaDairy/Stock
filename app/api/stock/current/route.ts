import { NextRequest, NextResponse } from "next/server"
import { getCurrentStock } from "@/lib/db/metrics"

export async function GET(req: NextRequest) {
  try {
    const unit = req.nextUrl.searchParams.get("unit") || undefined
    const data = await getCurrentStock(unit)
    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}