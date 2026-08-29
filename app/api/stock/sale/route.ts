import { NextRequest, NextResponse } from "next/server"
import { recordSaleEntry } from "@/lib/db/metrics"
import { turso } from "@/lib/turso"

interface SaleItemInput {
  productId?: string
  productName?: string
  date: string
  batchNumber: string
  saleCrt?: number
  salePc?: number
  saleTotal?: number
  unit?: string
  crtUnit?: string
  pcUnit?: string
  quantity?: number
  sale?: {
    crt?: number
    pc?: number
    total?: number
    unit?: string
  }
  notes?: string
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const items: SaleItemInput[] = Array.isArray(body) ? body : [body]

    if (items.length === 0) {
      return NextResponse.json({ success: false, error: "Empty request body" }, { status: 400 })
    }

    // Cache products for matching
    const prodResult = await turso.execute("SELECT id, name, sku_code, unit FROM products")
    const idSet = new Set<string>()
    const normMap = new Map<string, string>()

    for (const row of prodResult.rows) {
      const id = String(row.id)
      idSet.add(id)

      const normName = String(row.name).toLowerCase().replace(/[^a-z0-9]/g, "")
      normMap.set(normName, id)

      if (row.sku_code) {
        normMap.set(String(row.sku_code).toLowerCase().replace(/[^a-z0-9]/g, ""), id)
      }
    }

    const results = []
    for (const item of items) {
      let pid = item.productId

      // If productId was provided and valid
      if (pid && !idSet.has(pid)) {
        pid = undefined
      }

      // If no valid productId, resolve from productName
      if (!pid && item.productName) {
        const rawNorm = item.productName.toLowerCase().replace(/[^a-z0-9]/g, "")
        pid = normMap.get(rawNorm)

        // Partial match fallback
        if (!pid) {
          for (const [normKey, resolvedId] of normMap.entries()) {
            if (rawNorm.includes(normKey) || normKey.includes(rawNorm)) {
              pid = resolvedId
              break
            }
          }
        }
      }

      if (!pid || !item.date || !item.batchNumber) {
        console.warn("Skipping sale item due to missing fields:", { item, resolvedPid: pid })
        continue
      }

      const crt = Number(item.sale?.crt ?? item.saleCrt ?? 0)
      const pc = Number(item.sale?.pc ?? item.salePc ?? 0)
      const total = Number(item.sale?.total ?? item.saleTotal ?? (crt > 0 || pc > 0 ? 0 : (item.quantity ?? 0)))
      const itemUnit = item.sale?.unit || item.unit || undefined

      if (crt === 0 && pc === 0 && total === 0) {
        continue
      }

      const res = await recordSaleEntry({
        productId: pid,
        date: item.date,
        batchNumber: item.batchNumber,
        saleCrt: crt,
        salePc: pc,
        saleTotal: total,
        unit: itemUnit,
        notes: item.notes,
      })
      results.push(res)
    }

    return NextResponse.json({ success: true, recordedCount: results.length, data: results })
  } catch (err) {
    console.error("Sale API error:", err)
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}

