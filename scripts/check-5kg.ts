import { config } from "dotenv"
config({ path: ".env.local" })

async function checkDahi5kg() {
  const { turso } = await import("../lib/turso")
  const res = await turso.execute(`
    SELECT b.product_id, p.name, b.batch_number, dm.production_total, dm.sale_total, dm.closing_total, dm.sale_crt, dm.sale_pc, dm.closing_crt, dm.closing_pc
    FROM daily_metrics dm
    JOIN batches b ON b.id = dm.batch_id
    JOIN products p ON p.id = b.product_id
    WHERE b.product_id = 11
  `)
  console.log("Dahi 5kg in DB:", res.rows)
}

checkDahi5kg().catch(console.error)
