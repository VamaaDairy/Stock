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
 *   unit?: string,         // e.g. "CRT", "CBX", "PCS", "KG"
 *   crtUnit?: string,
 *   pcUnit?: string,
 *   manufacturingDate?: string,
 *   ubd?: string,          // Use Before Date
 *   expiryDate?: string,
 *   shelfLifeDays?: number,
 *   // Production quantity:
 *   productionPc?: number,  // loose pieces
 *   productionCrt?: number, // cartons/boxes
 *   productionTotal?: number, // primary unit total
 *   production?: { crt?: number, pc?: number, total?: number, unit?: string },
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
      skuCode,
      unit,
      crtUnit,
      pcUnit,
      manufacturingDate,
      ubd,
      expiryDate,
      shelfLifeDays,
      productionPc,
      productionCrt,
      productionTotal,
      production,
      notes,
    } = body

    if (!productId || !date || !batchNumber) {
      return NextResponse.json(
        { success: false, error: "productId, date, batchNumber are required" },
        { status: 400 }
      )
    }

    const prodCrt = Number(production?.crt ?? productionCrt ?? 0)
    const prodPc = Number(production?.pc ?? productionPc ?? 0)
    const prodTot = Number(production?.total ?? productionTotal ?? (prodCrt > 0 || prodPc > 0 ? 0 : (body.quantity ?? 0)))
    const entryUnit = production?.unit || unit || undefined

    const result = await upsertEntry({
      productId,
      date,
      batchNumber,
      skuCode,
      unit: entryUnit,
      crtUnit,
      pcUnit,
      manufacturingDate: manufacturingDate || null,
      ubd: ubd || null,
      expiryDate: expiryDate || null,
      shelfLifeDays: shelfLifeDays || null,
      production: { crt: prodCrt, pc: prodPc, total: prodTot, unit: entryUnit },
      sale: { crt: 0, pc: 0, total: 0 },
      salesReturn: { crt: 0, pc: 0, total: 0 },
      notes,
    })

    return NextResponse.json({ success: true, ...result })
  } catch (err) {
    console.error("POST /api/stock/add error:", err)
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}

