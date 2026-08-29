import { turso } from "../turso"

export interface DBProduct {
  id: string
  name: string
  skuCode: string
  category: string
  unit: string
  pcsPerCrt: number
  packLabel: string
  shelfLifeDays: number
}

export async function getAllProductsFromDB(unit?: string): Promise<DBProduct[]> {
  const sql = unit
    ? `SELECT id, name, sku_code, category, unit, COALESCE(pcs_per_crt, 1) as pcs_per_crt, COALESCE(pack_label, 'Crt/Box') as pack_label, COALESCE(shelf_life_days, 0) as shelf_life_days
       FROM products
       WHERE unit = ?
       ORDER BY category, name`
    : `SELECT id, name, sku_code, category, unit, COALESCE(pcs_per_crt, 1) as pcs_per_crt, COALESCE(pack_label, 'Crt/Box') as pack_label, COALESCE(shelf_life_days, 0) as shelf_life_days
       FROM products
       ORDER BY category, name`

  const result = await turso.execute({
    sql,
    args: unit ? [unit.toUpperCase()] : [],
  })

  return result.rows.map(row => ({
    id: String(row.id),
    name: String(row.name),
    skuCode: String(row.sku_code || ""),
    category: String(row.category),
    unit: String(row.unit),
    pcsPerCrt: Number(row.pcs_per_crt || 1),
    packLabel: String(row.pack_label || "Crt/Box"),
    shelfLifeDays: Number(row.shelf_life_days || 0),
  }))
}

export async function addProductToDB(product: {
  name: string
  skuCode: string
  category: string
  unit: string
  pcsPerCrt: number
  shelfLifeDays?: number
}): Promise<DBProduct> {
  const id = crypto.randomUUID()
  const pcsPerCrt = product.pcsPerCrt > 0 ? product.pcsPerCrt : 1
  const shelfLife = product.shelfLifeDays || 0

  await turso.execute({
    sql: `INSERT INTO products (id, name, sku_code, category, unit, pcs_per_crt, pack_label, shelf_life_days)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      product.name.trim(),
      product.skuCode.trim(),
      product.category.trim(),
      product.unit.toUpperCase(),
      pcsPerCrt,
      product.unit === "PCS" || product.unit === "KG" ? "Pcs" : "Crt/Box",
      shelfLife,
    ],
  })

  return {
    id,
    name: product.name.trim(),
    skuCode: product.skuCode.trim(),
    category: product.category.trim(),
    unit: product.unit.toUpperCase(),
    pcsPerCrt,
    packLabel: product.unit === "PCS" || product.unit === "KG" ? "Pcs" : "Crt/Box",
    shelfLifeDays: shelfLife,
  }
}

export async function updateProductInDB(product: {
  id: string
  name: string
  skuCode: string
  category: string
  unit: string
  pcsPerCrt: number
  shelfLifeDays?: number
}) {
  const pcsPerCrt = product.pcsPerCrt > 0 ? product.pcsPerCrt : 1
  const shelfLife = product.shelfLifeDays || 0

  await turso.execute({
    sql: `UPDATE products SET
            name = ?, sku_code = ?, category = ?, unit = ?, pcs_per_crt = ?, shelf_life_days = ?
          WHERE id = ?`,
    args: [
      product.name.trim(),
      product.skuCode.trim(),
      product.category.trim(),
      product.unit.toUpperCase(),
      pcsPerCrt,
      shelfLife,
      product.id,
    ],
  })
}

export async function deleteProductFromDB(id: string) {
  // Execute PRAGMA foreign_keys = OFF before deleting to prevent constraint failure if referenced in batches
  await turso.execute({ sql: `PRAGMA foreign_keys = OFF;`, args: [] })
  await turso.execute({
    sql: `DELETE FROM products WHERE id = ?`,
    args: [id],
  })
  await turso.execute({ sql: `PRAGMA foreign_keys = ON;`, args: [] })
}