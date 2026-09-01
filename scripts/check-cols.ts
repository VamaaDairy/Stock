import { config } from "dotenv"
config({ path: ".env.local" })

async function checkMetricsCols() {
  const { turso } = await import("../lib/turso")
  const tableInfo = await turso.execute("PRAGMA table_info(daily_metrics)")
  console.log("daily_metrics columns:", tableInfo.rows.map(r => r.name))
}

checkMetricsCols().catch(console.error)
