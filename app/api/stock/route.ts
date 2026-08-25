import { NextResponse } from "next/server"
import { getCurrentStock } from "@/lib/db/metrics"

/**
 * GET /api/stock
 * Alias to /api/stock/current
 * Returns all-time cumulative stock for every product and batch.
 */
export async function GET() {
  try {
    const data = await getCurrentStock()
    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
