import { config } from "dotenv"
config({ path: ".env.local" })

async function inspectDB() {
  const { turso } = await import("../lib/turso")
  const tables = await turso.execute("SELECT name FROM sqlite_master WHERE type='table'")
  console.log("Tables:", tables.rows.map(r => r.name))
  for (const t of tables.rows) {
    const count = await turso.execute(`SELECT count(*) as c FROM ${t.name}`)
    console.log(`${t.name} count:`, count.rows[0].c)
  }
}

inspectDB().catch(console.error)
