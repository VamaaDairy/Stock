import { config } from "dotenv"
config({ path: ".env.local" })

async function resetSales() {
  const { turso } = await import("../lib/turso")
  console.log("Resetting all sales to 0 so Closing Stock = Production...")
  
  await turso.execute(`
    UPDATE daily_metrics SET
      sale_crt = 0,
      sale_pc = 0,
      sale_total = 0,
      updated_at = datetime('now')
  `)
  
  const res = await turso.execute(`
    SELECT p.name, b.batch_number,
           dm.production_total, dm.sale_total, dm.closing_total,
           dm.production_crt, dm.production_pc,
           dm.closing_crt, dm.closing_pc, p.unit
    FROM daily_metrics dm
    JOIN batches b ON b.id = dm.batch_id
    JOIN products p ON p.id = b.product_id
    ORDER BY CAST(b.product_id AS INTEGER), b.batch_number
  `)
  
  console.log("\n✅ Current status after reset (Sale = 0, Closing = Production):")
  for (const r of res.rows) {
    console.log(`  ${r.name} (${r.batch_number}) -> Prod: ${r.production_total} | Sale: ${r.sale_total} | Closing: ${r.closing_total} ${r.unit}`)
  }
}

resetSales().catch(console.error)
