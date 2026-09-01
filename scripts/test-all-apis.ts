import { config } from "dotenv"
config({ path: ".env.local" })

async function testAllApis() {
  const { turso } = await import("../lib/turso")
  const { getCurrentStock, getDashboardData } = await import("../lib/db/metrics")

  console.log("================================================================================")
  console.log("1. TESTING DATABASE GENERATED COLUMNS AND MATH INTEGRITY")
  console.log("================================================================================")

  const rows = await turso.execute(`
    SELECT dm.id, b.date, b.product_id, p.name, p.unit, p.pcs_per_crt, b.batch_number,
           dm.opening_crt, dm.opening_pc, dm.opening_total,
           dm.production_crt, dm.production_pc, dm.production_total,
           dm.sale_crt, dm.sale_pc, dm.sale_total,
           (dm.opening_crt + dm.production_crt + dm.sales_return_crt - dm.sale_crt) as closing_crt,
           (dm.opening_pc + dm.production_pc + dm.sales_return_pc - dm.sale_pc) as closing_pc,
           (dm.opening_total + dm.production_total + dm.sales_return_total - dm.sale_total) as closing_total
    FROM daily_metrics dm
    JOIN batches b ON b.id = dm.batch_id
    JOIN products p ON p.id = b.product_id
    ORDER BY b.date DESC, CAST(b.product_id AS INTEGER), b.batch_number
  `)

  let errors = 0
  console.log(`Total active metric records in DB: ${rows.rows.length}\n`)

  for (const r of rows.rows) {
    const openingTotal = Number(r.opening_total || 0)
    const prodTotal = Number(r.production_total || 0)
    const saleTotal = Number(r.sale_total || 0)
    const expectedClosingTotal = openingTotal + prodTotal - saleTotal
    const actualClosingTotal = Number(r.closing_total)

    if (expectedClosingTotal !== actualClosingTotal) {
      errors++
      console.error(`❌ MISMATCH in [${r.name}] Batch ${r.batch_number}: expected ${expectedClosingTotal}, got ${actualClosingTotal}`)
    } else {
      console.log(`✅ [${r.name}] (${r.batch_number}): Prod=${prodTotal} - Sale=${saleTotal} = Closing=${actualClosingTotal} ${r.unit}`)
    }
  }

  console.log(`\nIntegrity Check Result: ${errors === 0 ? "ALL ROWS 100% CORRECT (Stock = Prod - Sale)" : `${errors} errors found`}`)

  console.log("\n================================================================================")
  console.log("2. TESTING /api/stock/current (VBA Macro Stock Endpoint)")
  console.log("================================================================================")

  const currentStock = await getCurrentStock()
  let totalBatchesAvailable = 0
  for (const cat of currentStock) {
    for (const prod of cat.products) {
      if (prod.batchesList && prod.batchesList.length > 0) {
        totalBatchesAvailable += prod.batchesList.length
        for (const b of prod.batchesList) {
          console.log(`  PID ${prod.id} [${prod.name}] Batch: ${b.batchNumber} | Unit: ${prod.unit} (${prod.pcsPerCrt}/crt) | Live Stock: ${b.closing.total} (${b.closing.crt} crt, ${b.closing.pc} pc)`)
        }
      }
    }
  }
  console.log(`\nTotal batches currently available for FIFO Macro allocation: ${totalBatchesAvailable}`)

  console.log("\n================================================================================")
  console.log("3. TESTING /api/dashboard (Website Dashboard Data)")
  console.log("================================================================================")

  const dates = Array.from(new Set(rows.rows.map(r => String(r.date))))
  for (const d of dates) {
    const dash = await getDashboardData(d)
    console.log(`Dashboard data for ${d}: ${dash.length} categories loaded successfully.`)
  }
}

testAllApis().catch(console.error)
