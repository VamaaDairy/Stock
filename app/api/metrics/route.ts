import { NextRequest, NextResponse } from "next/server"
import { upsertEntry, getMetricsForDate } from "@/lib/db/metrics"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = await upsertEntry(body)
    return NextResponse.json({ success: true, ...result })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date")
  if (!date) {
    return NextResponse.json({ success: false, error: "date query param required" }, { status: 400 })
  }
  const rows = await getMetricsForDate(date)
  return NextResponse.json({ success: true, data: rows })
}
