import { config } from "dotenv"
import type { StockProductRow } from "../lib/db/metrics"
config({ path: ".env.local" })

async function checkQuantitiesAreZero() {
  const { getDashboardData } = await import("../lib/db/metrics")
  const today = new Date().toISOString().slice(0, 10)
  const dashboardData = await getDashboardData(today)

  let nonZeroCount = 0
  dashboardData.forEach(cat => {
    cat.products.forEach((p: StockProductRow) => {
      if (p.production.total !== 0 || p.demand.total !== 0 || p.sale.total !== 0 || p.currentStock !== 0) {
        nonZeroCount++
      }
    })
  })

  console.log(`✅ All ${dashboardData.reduce((acc, c) => acc + c.products.length, 0)} products checked. Non-zero entries count: ${nonZeroCount}`)
}

checkQuantitiesAreZero().catch(console.error)