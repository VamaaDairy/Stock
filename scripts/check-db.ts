import { config } from "dotenv"
config({ path: ".env.local" })

async function check() {
  const { turso } = await import("../lib/turso")
  const res = await turso.execute(`
    SELECT b.product_id, p.name, p.unit, p.pcs_per_crt, b.batch_number,
           dm.production_crt, dm.production_pc, dm.production_total,
           dm.sale_crt, dm.sale_pc, dm.sale_total,
           dm.closing_crt, dm.closing_pc, dm.closing_total
    FROM daily_metrics dm
    JOIN batches b ON b.id = dm.batch_id
    JOIN products p ON p.id = b.product_id
    ORDER BY CAST(b.product_id AS INTEGER), b.batch_number
  `)
  console.log("Current DB rows count:", res.rows.length)
  for (const r of res.rows) {
    console.log(`PID ${r.product_id} [${r.name}] Batch: ${r.batch_number} | Unit: ${r.unit} (${r.pcs_per_crt}/crt) | Prod: ${r.production_total} (${r.production_crt} crt, ${r.production_pc} pc) | Sale: ${r.sale_total} (${r.sale_crt} crt, ${r.sale_pc} pc) | Closing: ${r.closing_total} (${r.closing_crt} crt, ${r.closing_pc} pc)`)
  }
}
check().catch(console.error)
