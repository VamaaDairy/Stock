import { config } from "dotenv"
config({ path: ".env.local" })

async function clearData() {
  const { turso } = await import("../lib/turso")
  console.log("Clearing daily_metrics and batches...")
  
  await turso.execute("DELETE FROM daily_metrics")
  await turso.execute("DELETE FROM batches")
  
  console.log("✅ All stock, production, sales, demand, and return metrics cleared to 0.")
}

clearData().catch(console.error)
