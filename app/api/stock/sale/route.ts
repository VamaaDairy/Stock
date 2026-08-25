import { NextRequest, NextResponse } from "next/server"
import { upsertEntry } from "@/lib/db/metrics"
import { turso } from "@/lib/turso"

interface SaleItemInput {
  productId?: string
  productName?: string
  date: string
  batchNumber: string
  saleCrt?: number
  salePc?: number
  saleTotal?: number
  notes?: string
}

/**
 * POST /api/stock/sale (also /api/stock/remove)
 * Records Sale entries in the system.
 *
 * Accepts either a single object or an array of objects.
 * Accepts productId OR productName (auto-resolves ID by matching product name).
 *
 * Recording a sale:
 * 1. Shows up in the Sales page as a Sale entry with its batch number.
 * 2. Current Stock automatically reduces via formula: (Opening + Production + Return - Sale).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const items: SaleItemInput[] = Array.isArray(body) ? body : [body]

    if (items.length === 0) {
      return NextResponse.json({ success: false, error: "Empty request body" }, { status: 400 })
    }

    // Cache products for name -> id lookup
    const prodResult = await turso.execute("SELECT id, name, sku_code FROM products")
    const nameToId = new Map<string, string>()
    for (const row of prodResult.rows) {
      const id = String(row.id)
      const name = String(row.name).toLowerCase().replace(/[^a-z0-9]/g, "")
      nameToId.set(name, id)
    }

    const results = []
    for (const item of items) {
      let pid = item.productId

      if (!pid && item.productName) {
        const norm = item.productName.toLowerCase().replace(/[^a-z0-9]/g, "")
        pid = nameToId.get(norm)
      }

      if (!pid || !item.date || !item.batchNumber) {
        continue
      }

      const crt = Number(item.saleCrt || 0)
      const pc = Number(item.salePc || 0)
      const total = Number(item.saleTotal || 0)

      if (crt === 0 && pc === 0 && total === 0) {
        continue
      }

      const res = await upsertEntry({
        productId: pid,
        date: item.date,
        batchNumber: item.batchNumber,
        production: { crt: 0, pc: 0, total: 0 },
        demand: { crt: 0, pc: 0, total: 0 },
        sale: { crt, pc, total },
        salesReturn: { crt: 0, pc: 0, total: 0 },
        notes: item.notes,
      })
      results.push(res)
    }

    return NextResponse.json({ success: true, recordedCount: results.length, data: results })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
