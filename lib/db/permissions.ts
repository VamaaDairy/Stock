import { turso } from "@/lib/turso"
import type { Role } from "./users"

export type PageKey =
  | "home"
  | "dashboard"
  | "production"
  | "sales"
  | "sales-return"
  | "products"
  | "about"
  | "settings"
  | "expiry"

// Default permissions for each role
const DEFAULT_PERMISSIONS: Record<Role, PageKey[]> = {
  admin: ["home", "dashboard", "production", "sales", "sales-return", "products", "about", "settings", "expiry"],
  manager: ["home", "dashboard", "production", "sales", "sales-return", "products", "about", "expiry"],
  viewer: ["home", "dashboard", "products", "about", "expiry"],
}

export async function ensurePermissionsTable() {
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS role_permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role TEXT NOT NULL,
      page TEXT NOT NULL,
      can_access INTEGER NOT NULL DEFAULT 1,
      UNIQUE(role, page)
    )
  `)
  // Seed defaults if table is empty
  const count = await turso.execute("SELECT COUNT(*) as c FROM role_permissions")
  const c = (count.rows[0] as unknown as { c: number }).c
  if (c === 0) {
    await seedDefaultPermissions()
  } else {
    // Ensure home & expiry permissions are enabled for all existing roles
    const roles: Role[] = ["admin", "manager", "viewer"]
    for (const role of roles) {
      await turso.execute({
        sql: "INSERT OR IGNORE INTO role_permissions (role, page, can_access) VALUES (?, 'home', 1)",
        args: [role],
      })
      await turso.execute({
        sql: "INSERT OR IGNORE INTO role_permissions (role, page, can_access) VALUES (?, 'expiry', 1)",
        args: [role],
      })
    }
  }
}

async function seedDefaultPermissions() {
  const allPages: PageKey[] = [
    "home", "dashboard", "production", "sales", "sales-return", "products", "about", "settings", "expiry",
  ]
  const roles: Role[] = ["admin", "manager", "viewer"]
  for (const role of roles) {
    for (const page of allPages) {
      const allowed = DEFAULT_PERMISSIONS[role].includes(page) ? 1 : 0
      await turso.execute({
        sql: "INSERT OR IGNORE INTO role_permissions (role, page, can_access) VALUES (?, ?, ?)",
        args: [role, page, allowed],
      })
    }
  }
}

export type PermissionMap = Record<PageKey, boolean>

export async function getPermissionsForRole(role: Role): Promise<PermissionMap> {
  await ensurePermissionsTable()
  const res = await turso.execute({
    sql: "SELECT page, can_access FROM role_permissions WHERE role = ?",
    args: [role],
  })
  const map = {} as PermissionMap
  for (const row of res.rows) {
    const r = row as unknown as { page: PageKey; can_access: number }
    map[r.page] = r.can_access === 1
  }
  return map
}

export type AllPermissions = Record<Role, PermissionMap>

export async function getAllPermissions(): Promise<AllPermissions> {
  await ensurePermissionsTable()
  const res = await turso.execute(
    "SELECT role, page, can_access FROM role_permissions ORDER BY role, page"
  )
  const result = {
    admin: {} as PermissionMap,
    manager: {} as PermissionMap,
    viewer: {} as PermissionMap,
  } as AllPermissions

  for (const row of res.rows) {
    const r = row as unknown as { role: Role; page: PageKey; can_access: number }
    if (result[r.role]) {
      result[r.role][r.page] = r.can_access === 1
    }
  }
  return result
}

export async function setPermission(role: Role, page: PageKey, canAccess: boolean) {
  await turso.execute({
    sql: `INSERT INTO role_permissions (role, page, can_access) VALUES (?, ?, ?)
          ON CONFLICT(role, page) DO UPDATE SET can_access = excluded.can_access`,
    args: [role, page, canAccess ? 1 : 0],
  })
}
