import { NextRequest, NextResponse } from "next/server"
import { upsertEntry, recordSaleEntry, getMetricsForDate } from "@/lib/db/metrics"
import { turso } from "@/lib/turso"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Bulk array support
    if (Array.isArray(body)) {
      const prodResult = await turso.execute("SELECT id, name, sku_code, unit FROM products")
      const idSet = new Set<string>()
      const normMap = new Map<string, string>()

      for (const row of prodResult.rows) {
        const id = String(row.id)
        idSet.add(id)
        normMap.set(String(row.name).toLowerCase().replace(/[^a-z0-9]/g, ""), id)
        if (row.sku_code) {
          normMap.set(String(row.sku_code).toLowerCase().replace(/[^a-z0-9]/g, ""), id)
        }
      }

      const results = []
      for (const item of body) {
        let pid = item.productId
        if (pid && !idSet.has(pid)) pid = undefined

        if (!pid && item.productName) {
          const rawNorm = item.productName.toLowerCase().replace(/[^a-z0-9]/g, "")
          pid = normMap.get(rawNorm)
          if (!pid) {
            for (const [k, v] of normMap.entries()) {
              if (rawNorm.includes(k) || k.includes(rawNorm)) {
                pid = v
                break
              }
            }
          }
        }

        if (!pid || !item.date || !item.batchNumber) continue

        const itemUnit = item.unit || item.sale?.unit || item.production?.unit || undefined

        if (item.production) {
          const res = await upsertEntry({
            productId: pid,
            date: item.date,
            batchNumber: item.batchNumber,
            skuCode: item.skuCode,
            unit: itemUnit,
            manufacturingDate: item.manufacturingDate,
            ubd: item.ubd,
            expiryDate: item.expiryDate,
            shelfLifeDays: item.shelfLifeDays,
            production: item.production,
            demand: item.demand,
            sale: item.sale || { crt: 0, pc: 0, total: 0 },
            salesReturn: item.salesReturn,
            salesTarget: item.salesTarget,
            notes: item.notes,
          })
          results.push(res)
        } else {
          const crt = Number(item.sale?.crt ?? item.saleCrt ?? 0)
          const pc = Number(item.sale?.pc ?? item.salePc ?? 0)
          const total = Number(item.sale?.total ?? item.saleTotal ?? (crt > 0 || pc > 0 ? 0 : (item.quantity ?? 0)))

          if (crt === 0 && pc === 0 && total === 0) continue

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
      }
      return NextResponse.json({ success: true, recordedCount: results.length, data: results })
    }

    // Single entry support
    const result = await upsertEntry(body)
    return NextResponse.json({ success: true, ...result })
  } catch (err) {
    console.error("Metrics API error:", err)
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

