"use client"
import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Role = "admin" | "manager" | "viewer"
type PageKey = "home" | "dashboard" | "production" | "sales" | "sales-return" | "products" | "about" | "settings"

const ALL_PAGES: { key: PageKey; label: string }[] = [
  { key: "home", label: "Home" },
  { key: "dashboard", label: "Dashboard" },
  { key: "production", label: "Production" },
  { key: "sales", label: "Sales" },
  { key: "sales-return", label: "Sales Return" },
  { key: "products", label: "Products" },
  { key: "about", label: "About" },
  { key: "settings", label: "Settings" },
]

const ROLES: Role[] = ["admin", "manager", "viewer"]
const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  manager: "Manager",
  viewer: "Viewer",
}
const ROLE_COLORS: Record<Role, string> = {
  admin: "bg-red-100 text-red-700",
  manager: "bg-blue-100 text-blue-700",
  viewer: "bg-slate-100 text-slate-600",
}

type User = { id: number; email: string; name: string; role: Role }
type PermissionMap = Record<PageKey, boolean>
type AllPermissions = Record<Role, PermissionMap>

type Me = { id: number; email: string; name: string; role: Role } | null

// ── Add User Modal ──────────────────────────────────────────────────────────
function AddUserModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: () => void
}) {
  const [form, setForm] = useState({ email: "", name: "", password: "", role: "viewer" as Role })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setLoading(false)
    if (data.success) {
      onCreated()
      onClose()
    } else {
      setError(data.error || "Failed to create user")
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Add New User</h2>
        <form onSubmit={submit} className="space-y-3">
          <Input
            placeholder="Full Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
          <Input
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            required
          />
          <Input
            placeholder="Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            required
          />
          <div>
            <label className="text-xs text-slate-500 font-medium mb-1 block">Role</label>
            <select
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as Role }))}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </div>
          {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
          <div className="flex gap-2 pt-1">
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "Creating…" : "Create User"}
            </Button>
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Admin View ──────────────────────────────────────────────────────────────
function AdminSettings({ me }: { me: Me }) {
  const [users, setUsers] = useState<User[]>([])
  const [permissions, setPermissions] = useState<AllPermissions | null>(null)
  const [showAddUser, setShowAddUser] = useState(false)
  const [activeTab, setActiveTab] = useState<"users" | "permissions">("users")

  const fetchUsers = useCallback(async () => {
    const res = await fetch("/api/admin/users")
    const data = await res.json()
    if (data.success) setUsers(data.users)
  }, [])

  const fetchPermissions = useCallback(async () => {
    const res = await fetch("/api/admin/permissions")
    const data = await res.json()
    if (data.success) setPermissions(data.permissions)
  }, [])

  useEffect(() => {
    fetchUsers()
    fetchPermissions()
  }, [fetchUsers, fetchPermissions])

  async function handleRoleChange(userId: number, newRole: Role) {
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: userId, role: newRole }),
    })
    fetchUsers()
  }

  async function handleDelete(userId: number) {
    if (!confirm("Delete this user?")) return
    await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: userId }),
    })
    fetchUsers()
  }

  async function handlePermissionToggle(role: Role, page: PageKey, current: boolean) {
    await fetch("/api/admin/permissions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, page, canAccess: !current }),
    })
    fetchPermissions()
  }

  return (
    <div className="flex flex-col flex-1 bg-white p-6 max-w-5xl mx-auto w-full">
      {showAddUser && (
        <AddUserModal onClose={() => setShowAddUser(false)} onCreated={fetchUsers} />
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-800">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Manage users and role permissions</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit mb-6">
        <button
          onClick={() => setActiveTab("users")}
          className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${
            activeTab === "users" ? "bg-white shadow text-slate-800" : "text-slate-500"
          }`}
        >
          Users
        </button>
        <button
          onClick={() => setActiveTab("permissions")}
          className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${
            activeTab === "permissions" ? "bg-white shadow text-slate-800" : "text-slate-500"
          }`}
        >
          Role Permissions
        </button>
      </div>

      {/* ── Users Tab ── */}
      {activeTab === "users" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-700">
              All Users ({users.length})
            </h2>
            <Button size="sm" onClick={() => setShowAddUser(true)}>
              + Add User
            </Button>
          </div>

          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Name</th>
                  <th className="text-left px-4 py-3 font-semibold">Email</th>
                  <th className="text-left px-4 py-3 font-semibold">Role</th>
                  <th className="text-right px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {user.name}
                      {user.id === me?.id && (
                        <span className="ml-2 text-xs text-slate-400">(you)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{user.email}</td>
                    <td className="px-4 py-3">
                      <select
                        value={user.role}
                        disabled={user.id === me?.id}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as Role)}
                        className={`text-xs font-semibold rounded-full px-2 py-1 border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-60 disabled:cursor-not-allowed ${ROLE_COLORS[user.role]}`}
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {ROLE_LABELS[r]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {user.id !== me?.id && (
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="text-xs text-red-500 hover:text-red-700 font-medium"
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Permissions Tab ── */}
      {activeTab === "permissions" && permissions && (
        <div>
          <h2 className="text-base font-bold text-slate-700 mb-4">Page Access by Role</h2>
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Page</th>
                  {ROLES.map((role) => (
                    <th key={role} className="text-center px-4 py-3 font-semibold">
                      {ROLE_LABELS[role]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ALL_PAGES.map((page) => (
                  <tr key={page.key} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-700">{page.label}</td>
                    {ROLES.map((role) => {
                      const allowed = permissions[role]?.[page.key] ?? false
                      const isAdminSettings = role === "admin" && page.key === "settings"
                      return (
                        <td key={role} className="px-4 py-3 text-center">
                          <button
                            disabled={isAdminSettings}
                            onClick={() =>
                              !isAdminSettings &&
                              handlePermissionToggle(role, page.key, allowed)
                            }
                            className={`w-10 h-5 rounded-full transition-colors relative ${
                              allowed ? "bg-green-500" : "bg-slate-300"
                            } ${isAdminSettings ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                          >
                            <span
                              className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${
                                allowed ? "left-5" : "left-0.5"
                              }`}
                            />
                          </button>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-400 mt-3">
            Changes take effect on the user&apos;s next page load.
          </p>
        </div>
      )}
    </div>
  )
}

// ── Non-Admin Profile View ──────────────────────────────────────────────────
function ProfileSettings({ me }: { me: Me }) {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-white p-8">
      <div className="w-full max-w-sm border border-slate-200 rounded-xl p-6 space-y-4">
        <h1 className="text-2xl font-black text-slate-800">Settings</h1>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-400 font-medium uppercase tracking-wide">
              Name
            </label>
            <p className="text-slate-800 font-semibold mt-0.5">{me?.name}</p>
          </div>
          <div>
            <label className="text-xs text-slate-400 font-medium uppercase tracking-wide">
              Email
            </label>
            <p className="text-slate-800 font-semibold mt-0.5">{me?.email}</p>
          </div>
          <div>
            <label className="text-xs text-slate-400 font-medium uppercase tracking-wide">
              Role
            </label>
            <span
              className={`inline-block mt-1 text-xs font-semibold rounded-full px-3 py-1 ${
                me?.role ? ROLE_COLORS[me.role] : "bg-slate-100 text-slate-600"
              }`}
            >
              {me?.role ? ROLE_LABELS[me.role] : "—"}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Settings Page ──────────────────────────────────────────────────────
export default function SettingsPage() {
  const [me, setMe] = useState<Me>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setMe({ id: data.id, email: data.email, name: data.name, role: data.role })
        }
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center h-screen">
        <span className="text-slate-400 text-sm">Loading…</span>
      </div>
    )
  }

  if (me?.role === "admin") {
    return <AdminSettings me={me} />
  }

  return <ProfileSettings me={me} />
}
