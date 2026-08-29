import { turso } from "@/lib/turso"
import bcrypt from "bcryptjs"

export type Role = "admin" | "manager" | "viewer"

export type User = {
  id: number
  email: string
  passwordHash: string
  name: string
  role: Role
}

export type PublicUser = {
  id: number
  email: string
  name: string
  role: Role
}

export async function ensureUsersTable() {
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'viewer'
    )
  `)
  // Migrate: add role column if missing (idempotent)
  try {
    await turso.execute(`ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'viewer'`)
  } catch {
    // Column already exists — ignore
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const res = await turso.execute({
    sql: "SELECT id, email, password_hash as passwordHash, name, role FROM users WHERE email = ?",
    args: [email],
  })
  if (res.rows.length === 0) return null
  return res.rows[0] as unknown as User
}

export async function getUserById(id: number): Promise<PublicUser | null> {
  const res = await turso.execute({
    sql: "SELECT id, email, name, role FROM users WHERE id = ?",
    args: [id],
  })
  if (res.rows.length === 0) return null
  return res.rows[0] as unknown as PublicUser
}

export async function getAllUsers(): Promise<PublicUser[]> {
  const res = await turso.execute(
    "SELECT id, email, name, role FROM users ORDER BY id ASC"
  )
  return res.rows as unknown as PublicUser[]
}

export async function createUser(
  email: string,
  password: string,
  name: string,
  role: Role = "viewer"
) {
  const passwordHash = await bcrypt.hash(password, 10)
  await turso.execute({
    sql: "INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)",
    args: [email, passwordHash, name, role],
  })
}

export async function updateUserRole(id: number, role: Role) {
  await turso.execute({
    sql: "UPDATE users SET role = ? WHERE id = ?",
    args: [role, id],
  })
}

export async function deleteUser(id: number) {
  await turso.execute({
    sql: "DELETE FROM users WHERE id = ?",
    args: [id],
  })
}

export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash)
}
