import { config } from "dotenv"
config({ path: ".env.local" })

async function test() {
  const { turso } = await import("../lib/turso")
  const result = await turso.execute("SELECT name FROM sqlite_master WHERE type='table'")
  console.log("Tables in database:", result.rows.map(r => r.name))
}

test()
