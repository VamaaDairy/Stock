import { NextRequest, NextResponse } from "next/server"
import { upsertEntry } from "@/lib/db/metrics"

/**
 * POST /api/stock/remove
 * Records a Sale entry (removes stock).
 *
 * Request body:
 * {
 *   productId: string,
 *   date: string,          // YYYY-MM-DD (sale date)
 *   batchNumber: string,   // batch code e.g. "AA02EIP"
 *   // Sale quantity (smallest units):
 *   salePc: number,        // loose pieces sold
 *   saleCrt: number,       // cartons/boxes sold
 *   saleTotal: number,     // primary unit total sold
 *   notes?: string
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      productId,
      date,
      batchNumber,
      salePc = 0,
      saleCrt = 0,
      saleTotal = 0,
      notes,
    } = body

    if (!productId || !date || !batchNumber) {
      return NextResponse.json(
        { success: false, error: "productId, date, batchNumber are required" },
        { status: 400 }
      )
    }

    const result = await upsertEntry({
      productId,
      date,
      batchNumber,
      production: { crt: 0, pc: 0, total: 0 },
      demand: { crt: 0, pc: 0, total: 0 },
      sale: { crt: saleCrt, pc: salePc, total: saleTotal },
      salesReturn: { crt: 0, pc: 0, total: 0 },
      notes,
    })

    return NextResponse.json({ success: true, ...result })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
