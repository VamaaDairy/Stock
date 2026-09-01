import { config } from "dotenv"
config({ path: ".env.local" })

async function schemaCheck() {
  const { turso } = await import("../lib/turso")
  const tableInfo = await turso.execute("PRAGMA table_info(users)")
  console.log("Users Table columns:", tableInfo.rows)

  const users = await turso.execute("SELECT * FROM users")
  console.log("Users rows:", users.rows)
}

schemaCheck().catch(console.error)
