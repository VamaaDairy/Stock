import { turso } from "@/lib/turso"
import bcrypt from "bcryptjs"

export type User = {
  id: number
  email: string
  passwordHash: string
  name: string
}

export async function ensureUsersTable() {
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL
    )
  `)
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const res = await turso.execute({
    sql: "SELECT id, email, password_hash as passwordHash, name FROM users WHERE email = ?",
    args: [email],
  })
  if (res.rows.length === 0) return null
  return res.rows[0] as unknown as User
}

export async function createUser(email: string, password: string, name: string) {
  const passwordHash = await bcrypt.hash(password, 10)
  await turso.execute({
    sql: "INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)",
    args: [email, passwordHash, name],
  })
}

export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash)
}
