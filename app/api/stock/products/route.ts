import { NextResponse } from "next/server"
import { turso } from "@/lib/turso"

/**
 * GET /api/stock/products
 * Returns all products with their metadata for macro/bill use.
 * Includes: id, name, skuCode, category, unit, pcsPerCrt, shelfLifeDays
 *
 * Use this to populate dropdowns in your macro before calling /api/stock/add or /api/stock/remove.
 */
export async function GET() {
  try {
    const result = await turso.execute({
      sql: `SELECT id, name, sku_code, category, unit,
                   COALESCE(pcs_per_crt, 1) as pcs_per_crt,
                   COALESCE(shelf_life_days, 0) as shelf_life_days
            FROM products
            ORDER BY category, name`,
    })

    const products = result.rows.map(r => ({
      id: String(r.id),
      name: String(r.name),
      skuCode: String(r.sku_code || ""),
      category: String(r.category),
      unit: String(r.unit),
      pcsPerCrt: Number(r.pcs_per_crt || 1),
      shelfLifeDays: Number(r.shelf_life_days || 0),
    }))

    return NextResponse.json({ success: true, data: products })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
