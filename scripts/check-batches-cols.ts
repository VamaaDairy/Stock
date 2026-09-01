import { config } from "dotenv"
config({ path: ".env.local" })

async function checkBatchesCols() {
  const { turso } = await import("../lib/turso")
  const tableInfo = await turso.execute("PRAGMA table_info(batches)")
  console.log("batches columns:", tableInfo.rows.map(r => r.name))
}

checkBatchesCols().catch(console.error)
