import { NextRequest, NextResponse } from "next/server"
import { getDashboardData, getPeriodDashboardData } from "@/lib/db/metrics"

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date")
  const fromDate = req.nextUrl.searchParams.get("fromDate")
  const toDate = req.nextUrl.searchParams.get("toDate")

  if (fromDate && toDate) {
    const data = await getPeriodDashboardData(fromDate, toDate)
    return NextResponse.json({ success: true, data })
  }

  if (!date) {
    return NextResponse.json({ success: false, error: "date or fromDate & toDate required" }, { status: 400 })
  }
  const data = await getDashboardData(date)
  return NextResponse.json({ success: true, data })
}
