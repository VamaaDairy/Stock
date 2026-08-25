import { NextRequest, NextResponse } from "next/server"
import { upsertEntry } from "@/lib/db/metrics"

/**
 * POST /api/stock/add
 * Records a Production entry (adds stock).
 *
 * Request body:
 * {
 *   productId: string,
 *   date: string,          // YYYY-MM-DD (production date)
 *   batchNumber: string,   // batch code e.g. "AA02EIP"
 *   manufacturingDate?: string,
 *   ubd?: string,          // Use Before Date
 *   expiryDate?: string,
 *   shelfLifeDays?: number,
 *   // Production quantity (smallest units):
 *   productionPc: number,  // loose pieces
 *   productionCrt: number, // cartons/boxes (optional, auto-calc if pcsPerCrt known)
 *   productionTotal: number, // primary unit total
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
      manufacturingDate,
      ubd,
      expiryDate,
      shelfLifeDays,
      productionPc = 0,
      productionCrt = 0,
      productionTotal = 0,
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
      manufacturingDate: manufacturingDate || null,
      ubd: ubd || null,
      expiryDate: expiryDate || null,
      shelfLifeDays: shelfLifeDays || null,
      production: { crt: productionCrt, pc: productionPc, total: productionTotal },
      demand: { crt: 0, pc: 0, total: 0 },
      sale: { crt: 0, pc: 0, total: 0 },
      salesReturn: { crt: 0, pc: 0, total: 0 },
      notes,
    })

    return NextResponse.json({ success: true, ...result })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
