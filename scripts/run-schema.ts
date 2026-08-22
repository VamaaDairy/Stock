import { config } from "dotenv"
config({ path: ".env.local" })
import { createClient } from "@libsql/client"
import { readFileSync } from "fs"

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
})

async function run() {
  console.log("Applying database schema changes...")

  await db.execute(`PRAGMA foreign_keys = OFF`)
  await db.execute(`DROP TABLE IF EXISTS daily_metrics`)
  await db.execute(`DROP TABLE IF EXISTS batches`)
  await db.execute(`DROP TABLE IF EXISTS products`)
  await db.execute(`PRAGMA foreign_keys = ON`)

  const schema = readFileSync("scripts/schema.sql", "utf-8")
  await db.executeMultiple(schema)
  
  // Safe ALTER table migration step for products table in case it was not dropped
  try {
    await db.execute(`ALTER TABLE products ADD COLUMN shelf_life_days INTEGER DEFAULT 0`)
  } catch (e) {
    // column already exists, ignore
  }

  console.log("✅ Schema applied successfully")
}

run().catch(console.error)
