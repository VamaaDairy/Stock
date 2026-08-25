import * as dotenv from "dotenv"
dotenv.config({ path: ".env.local" })
dotenv.config({ path: ".env" })
import { createClient } from "@libsql/client"
import { products } from "../lib/data/products"

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
})

async function run() {
  console.log("Updating product names in database...")

  for (const p of products) {
    await db.execute({
      sql: `UPDATE products SET name = ?, sku_code = ?, category = ?, unit = ?, pcs_per_crt = ?, shelf_life_days = ? WHERE id = ?`,
      args: [p.name, p.skuCode, p.category, p.unit, p.pcsPerCrt, p.shelfLifeDays ?? null, p.id],
    })
    console.log(`Updated [${p.id}]: ${p.name}`)
  }

  console.log("✅ All 53 products updated successfully in database!")
}

run().catch(console.error)
