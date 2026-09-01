import { config } from "dotenv"
config({ path: ".env.local" })

async function fixAndPostCorrectSales() {
  const { turso } = await import("../lib/turso")
  const { recordSaleEntry } = await import("../lib/db/metrics")

  console.log("1. Resetting all sales to 0 first...")
  await turso.execute(`UPDATE daily_metrics SET sale_crt = 0, sale_pc = 0, sale_total = 0, updated_at = datetime('now')`)

  console.log("2. Posting exact 31-Aug Day Book Sales...")

  // The exact Day Book dispatches from 31-Aug Raipur-3:
  // TM 500ml (24/crt): 4 CRT + 1 CRT = 5.0 CRT (120 pcs) -> Batch AR31HIL
  // CM 500ml (24/crt): 5 CRT + 0.25 CRT = 5.25 CRT (126 pcs) -> Batch AS31HID
  // Dahi 200g (60/crt): 86 pcs = 1.4333 CRT (1 CRT 26 pcs) -> Batch AA30HIJ
  // Dahi 1kg (12/crt): 209 pcs = 17.4167 CRT (17 CRT 5 pcs) -> Batch AA30HIM
  // Dahi 5kg (2/crt): 2 pcs = 1.0 CRT -> Batch AA29HIN
  // Kadhi Dahi 200g (60/crt): 96 pcs = 1.6 CRT (1 CRT 36 pcs) -> Batch AB30HIJ
  // Kadhi Dahi 1kg (12/crt): 70 pcs = 5.8333 CRT (5 CRT 10 pcs) -> Batch AB30HIM
  // Paneer 200g (1/crt): 194 pcs -> Batch AK29HIJ
  // Paneer 500g (1/crt): 67 pcs to AK29HIL (batch stock exhausted) + 62 pcs Primary Batch
  // Paneer 1kg (1/crt): 14 pcs -> Primary Batch (no stock in DB)
  // Ghee 200ml (24/cbx): 13 CBX -> Batch AL03HIJ
  // Ghee 500ml (12/cbx): 8 CBX -> Primary Batch
  // Cow Ghee 1L Ceka (12/cbx): 20 CBX -> Batch AL29GIM
  // Shahi Rabdi 80g Box(6Pc) (6/cbx): 59 CBX -> Batch AV29HIQ

  const date = "2026-08-31"

  const salesEntries = [
    { productId: "1", batchNumber: "AR31HIL", saleCrt: 5.0, saleTotal: 5.0, unit: "CRT" },
    { productId: "2", batchNumber: "AS31HID", saleCrt: 5.25, saleTotal: 5.25, unit: "CRT" },
    { productId: "8", batchNumber: "AA30HIJ", saleCrt: 86 / 60, saleTotal: 86 / 60, unit: "CRT" },
    { productId: "10", batchNumber: "AA30HIM", saleCrt: 209 / 12, saleTotal: 209 / 12, unit: "CRT" },
    { productId: "11", batchNumber: "AA29HIN", saleCrt: 1.0, saleTotal: 1.0, unit: "CRT" },
    { productId: "19", batchNumber: "AB30HIJ", saleCrt: 96 / 60, saleTotal: 96 / 60, unit: "CRT" },
    { productId: "20", batchNumber: "AB30HIM", saleCrt: 70 / 12, saleTotal: 70 / 12, unit: "CRT" },
    { productId: "29", batchNumber: "AK29HIJ", saleCrt: 194, saleTotal: 194, unit: "PCS" },
    { productId: "30", batchNumber: "AK29HIL", saleCrt: 67, saleTotal: 67, unit: "PCS" },
  ]

  for (const entry of salesEntries) {
    await recordSaleEntry({
      productId: entry.productId,
      date,
      batchNumber: entry.batchNumber,
      saleCrt: entry.saleCrt,
      saleTotal: entry.saleTotal,
      unit: entry.unit,
    })
  }

  console.log("\n3. Current Live Status in DB after correct posting:")
  const res = await turso.execute(`
    SELECT b.product_id, p.name, p.unit, p.pcs_per_crt, b.batch_number,
           dm.production_total, dm.sale_total, dm.closing_total,
           dm.production_crt, dm.production_pc,
           dm.sale_crt, dm.sale_pc,
           dm.closing_crt, dm.closing_pc
    FROM daily_metrics dm
    JOIN batches b ON b.id = dm.batch_id
    JOIN products p ON p.id = b.product_id
    WHERE dm.sale_total > 0
    ORDER BY CAST(b.product_id AS INTEGER), b.batch_number
  `)

  for (const r of res.rows) {
    console.log(`[PID ${r.product_id}] ${r.name} (${r.batch_number}):`)
    console.log(`   Prod:    ${r.production_total} PCS (${r.production_crt} crt, ${r.production_pc} pc)`)
    console.log(`   Sale:    ${r.sale_total} PCS (${r.sale_crt} crt, ${r.sale_pc} pc)`)
    console.log(`   Closing: ${r.closing_total} PCS (${r.closing_crt} crt, ${r.closing_pc} pc)`)
  }
}

fixAndPostCorrectSales().catch(console.error)
