import { config } from "dotenv"
config({ path: ".env.local" })
import bcrypt from "bcryptjs"

async function checkUsers() {
  const { turso } = await import("../lib/turso")
  const res = await turso.execute("SELECT id, name, email, password, role FROM users")
  console.log("Users in DB:", res.rows.length)
  for (const u of res.rows) {
    const isMatch = await bcrypt.compare("Gaia@2026", String(u.password))
    console.log(`User: ${u.email} | Name: ${u.name} | Role: ${u.role} | Password match Gaia@2026: ${isMatch}`)
  }
}

checkUsers().catch(console.error)
