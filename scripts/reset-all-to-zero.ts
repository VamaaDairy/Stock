import { config } from "dotenv"
config({ path: ".env.local" })

async function resetAllDataToZero() {
  const { turso } = await import("../lib/turso")

  console.log("1. Clearing all transactional tables (daily_metrics, batches, expired_stock, sales_returns, sales_return_items)...")
  
  await turso.execute("DELETE FROM daily_metrics")
  await turso.execute("DELETE FROM batches")
  await turso.execute("DELETE FROM expired_stock")
  await turso.execute("DELETE FROM sales_return_items")
  await turso.execute("DELETE FROM sales_returns")

  console.log("2. Verifying table counts:")
  const tables = ["products", "batches", "daily_metrics", "expired_stock", "sales_returns", "sales_return_items"]
  for (const t of tables) {
    const res = await turso.execute(`SELECT count(*) as c FROM ${t}`)
    console.log(`   ${t}: ${res.rows[0].c}`)
  }

  console.log("\n3. Testing /api/dashboard / getCurrentStock...")
  const { getDashboardData, getCurrentStock } = await import("../lib/db/metrics")
  const dash = await getDashboardData("2026-09-04")
  let totalStock = 0
  let totalProd = 0
  let totalSale = 0
  for (const cat of dash) {
    for (const p of cat.products) {
      totalStock += p.currentStockTotal || 0
      totalProd += p.production?.total || 0
      totalSale += p.sale?.total || 0
    }
  }

  const stock = await getCurrentStock()
  let liveStockCount = 0
  for (const cat of stock) {
    for (const p of cat.products) {
      liveStockCount += (p.batchesList || []).length
    }
  }

  console.log(`\nDashboard Summary:`)
  console.log(`   Total Production: ${totalProd}`)
  console.log(`   Total Sales:      ${totalSale}`)
  console.log(`   Total Stock:      ${totalStock}`)
  console.log(`   Live Batches:     ${liveStockCount}`)
  console.log("\nEverything is completely reset to 0 0!")
}

resetAllDataToZero().catch(console.error)
