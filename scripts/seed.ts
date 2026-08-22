import { config } from "dotenv"
config({ path: ".env.local" })

async function seed() {
  const { turso } = await import("../lib/turso")
  const { products } = await import("../lib/data/products")

  for (const p of products) {
    await turso.execute({
      sql: `INSERT INTO products (id, name, sku_code, category, unit, pcs_per_crt, pack_label, shelf_life_days)
            VALUES (?, ?, ?, ?, ?, ?, 'Crt/Box', ?)
            ON CONFLICT(id) DO UPDATE SET
              name=excluded.name,
              sku_code=excluded.sku_code,
              category=excluded.category,
              unit=excluded.unit,
              pcs_per_crt=excluded.pcs_per_crt,
              shelf_life_days=excluded.shelf_life_days`,
      args: [p.id, p.name, p.skuCode || "", p.category, p.unit, p.pcsPerCrt || 1, p.shelfLifeDays || 0],
    })
  }
  console.log(`✅ Seeded ${products.length} products with Product Codes (SKU) & Pack Size Conversions`)
}

seed()
