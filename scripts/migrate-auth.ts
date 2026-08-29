import { config } from "dotenv"
config({ path: ".env.local" })

async function migrate() {
  const { turso } = await import("../lib/turso")
  const bcrypt = await import("bcryptjs")

  console.log("▶ Running migration: add role to users + create role_permissions...")

  // 1. Add role column to users (idempotent)
  try {
    await turso.execute(`ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'viewer'`)
    console.log("  ✅ Added 'role' column to users")
  } catch {
    console.log("  ℹ️  'role' column already exists in users")
  }

  // 2. Create users table if not exists
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'viewer'
    )
  `)

  // 3. Ensure admin account exists
  const adminEmail = "darshan@vamaadairy.com"
  const existing = await turso.execute({
    sql: "SELECT id FROM users WHERE email = ?",
    args: [adminEmail],
  })

  if (existing.rows.length === 0) {
    const adminPassword = process.env.ADMIN_PASSWORD || "Gaia@2026"
    const hash = await bcrypt.hash(adminPassword, 10)
    await turso.execute({
      sql: "INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)",
      args: [adminEmail, hash, "Darshan", "admin"],
    })
    console.log(`  ✅ Admin user created: ${adminEmail} (password: ${adminPassword})`)
  } else {
    // Update existing admin to admin role
    await turso.execute({
      sql: "UPDATE users SET role = 'admin' WHERE email = ?",
      args: [adminEmail],
    })
    console.log(`  ✅ Admin role ensured for: ${adminEmail}`)
  }

  // 4. Create role_permissions table
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS role_permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role TEXT NOT NULL,
      page TEXT NOT NULL,
      can_access INTEGER NOT NULL DEFAULT 1,
      UNIQUE(role, page)
    )
  `)
  console.log("  ✅ role_permissions table ready")

  // 5. Seed default permissions
  const defaults: Record<string, string[]> = {
    admin: ["dashboard", "production", "sales", "sales-return", "products", "about", "settings"],
    manager: ["dashboard", "production", "sales", "sales-return", "products", "about"],
    viewer: ["dashboard", "products", "about"],
  }
  const allPages = ["dashboard", "production", "sales", "sales-return", "products", "about", "settings"]

  for (const role of ["admin", "manager", "viewer"]) {
    for (const page of allPages) {
      const allowed = defaults[role].includes(page) ? 1 : 0
      await turso.execute({
        sql: "INSERT OR IGNORE INTO role_permissions (role, page, can_access) VALUES (?, ?, ?)",
        args: [role, page, allowed],
      })
    }
  }
  console.log("  ✅ Default permissions seeded")

  console.log("\n✅ Migration complete!")
}

migrate().catch(console.error)
