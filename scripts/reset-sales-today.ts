import { config } from "dotenv"
config({ path: ".env.local" })

async function resetTodaySales() {
  const { turso } = await import("../lib/turso")

  console.log("Resetting all sales to 0 for today...")
  await turso.execute(`
    UPDATE daily_metrics SET
      sale_crt = 0,
      sale_pc = 0,
      sale_total = 0,
      updated_at = datetime('now')
  `)

  console.log("Sales reset done. Verifying all batches currently in DB:")
  const res = await turso.execute(`
    SELECT b.product_id, p.name, p.unit, p.pcs_per_crt, b.batch_number,
           dm.production_total, dm.sale_total, dm.closing_total,
           dm.production_crt, dm.production_pc,
           dm.closing_crt, dm.closing_pc
    FROM daily_metrics dm
    JOIN batches b ON b.id = dm.batch_id
    JOIN products p ON p.id = b.product_id
    ORDER BY CAST(b.product_id AS INTEGER), b.batch_number
  `)

  for (const r of res.rows) {
    console.log(`[PID ${r.product_id}] ${r.name} (${r.batch_number}):`)
    console.log(`   Prod:    ${r.production_total} PCS (${r.production_crt} crt, ${r.production_pc} pc)`)
    console.log(`   Sale:    ${r.sale_total} PCS`)
    console.log(`   Closing: ${r.closing_total} PCS (${r.closing_crt} crt, ${r.closing_pc} pc) [Unit: ${r.unit}]`)
  }
}

resetTodaySales().catch(console.error)
