import { NextRequest, NextResponse } from "next/server"
import { turso } from "@/lib/turso"

export async function GET(req: NextRequest) {
  try {
    const unit = req.nextUrl.searchParams.get("unit")

    const sql = unit
      ? `SELECT id, name, sku_code, category, unit,
                COALESCE(pcs_per_crt, 1) as pcs_per_crt,
                COALESCE(shelf_life_days, 0) as shelf_life_days
         FROM products
         WHERE unit = ?
         ORDER BY category, name`
      : `SELECT id, name, sku_code, category, unit,
                COALESCE(pcs_per_crt, 1) as pcs_per_crt,
                COALESCE(shelf_life_days, 0) as shelf_life_days
         FROM products
         ORDER BY category, name`

    const result = await turso.execute({
      sql,
      args: unit ? [unit.toUpperCase()] : [],
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