import { config } from "dotenv"
config({ path: ".env.local" })
import { createClient } from "@libsql/client"
import { readFileSync } from "fs"

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
})

async function run() {
  console.log("Migrating Turso Database to add sales_return columns...")

  // Add columns if they don't exist
  try {
    await db.execute(`ALTER TABLE daily_metrics ADD COLUMN sales_return_crt REAL NOT NULL DEFAULT 0`)
    console.log("Added sales_return_crt")
  } catch (e) {
    console.log("sales_return_crt already exists or alter skipped")
  }

  try {
    await db.execute(`ALTER TABLE daily_metrics ADD COLUMN sales_return_pc REAL NOT NULL DEFAULT 0`)
    console.log("Added sales_return_pc")
  } catch (e) {
    console.log("sales_return_pc already exists or alter skipped")
  }

  try {
    await db.execute(`ALTER TABLE daily_metrics ADD COLUMN sales_return_total REAL NOT NULL DEFAULT 0`)
    console.log("Added sales_return_total")
  } catch (e) {
    console.log("sales_return_total already exists or alter skipped")
  }

  // Drop and recreate daily_metrics to update GENERATED ALWAYS AS columns
  try {
    await db.execute(`PRAGMA foreign_keys = OFF`)
    await db.execute(`DROP TABLE IF EXISTS daily_metrics`)
    await db.execute(`PRAGMA foreign_keys = ON`)

    const schema = readFileSync("scripts/schema.sql", "utf-8")
    await db.executeMultiple(schema)
    console.log("Re-applied schema with generated columns successfully")
  } catch (e) {
    console.error("Re-applying schema failed:", e)
  }

  console.log("✅ Migration complete!")
}

run().catch(console.error)
