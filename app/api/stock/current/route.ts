import { NextResponse } from "next/server"
import { getCurrentStock } from "@/lib/db/metrics"

/**
 * GET /api/stock/current
 * Returns all-time cumulative stock for every product+batch.
 * No date filter — shows true current inventory.
 * Stock displayed in smallest units (CRT + PC).
 *
 * Response shape:
 * {
 *   success: true,
 *   data: [
 *     {
 *       category: "Dahi",
 *       products: [
 *         {
 *           id, name, skuCode, unit, pcsPerCrt,
 *           currentStockCrt, currentStockPc, currentStockTotal,
 *           currentStockDisplay,   // e.g. "10 CRT + 3 PC"
 *           productionTotal, saleTotal, salesReturnTotal,
 *           batchesList: [
 *             { batchNumber, ubd, manufacturingDate, closing: { crt, pc, total }, closingDisplay }
 *           ]
 *         }
 *       ]
 *     }
 *   ]
 * }
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
