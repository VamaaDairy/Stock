'use client'

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { Home, Info, LayoutDashboard, Settings, Package, Factory, Truck, RotateCcw, User, LogOut } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar"

type PageKey = "dashboard" | "production" | "sales" | "sales-return" | "products" | "about" | "settings"
type PermissionMap = Partial<Record<PageKey, boolean>>

const ALL_PAGES: { key: PageKey; name: string; href: string; icon: React.ElementType }[] = [
  { key: "dashboard", name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { key: "production", name: "Production", href: "/production", icon: Factory },
  { key: "sales", name: "Sales", href: "/sales", icon: Truck },
  { key: "sales-return", name: "Sales Return", href: "/sales-return", icon: RotateCcw },
  { key: "products", name: "Products", href: "/products", icon: Package },
  { key: "about", name: "About", href: "/about", icon: Info },
  { key: "settings", name: "Settings", href: "/settings", icon: Settings },
]

function GaiaLogo({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 260 150"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M16 42
           C 8 26, 16 6, 38 4
           C 53 2, 58 12, 70 8
           C 88 2, 102 14, 116 6
           C 132 -2, 148 8, 162 4
           C 180 -1, 198 4, 210 16
           C 224 28, 228 36, 222 48
           C 230 56, 232 68, 222 76
           C 228 84, 224 94, 212 92
           C 214 100, 202 106, 190 100
           C 180 106, 166 102, 160 94
           C 146 102, 128 98, 122 88
           C 108 96, 90 92, 84 82
           C 68 88, 50 82, 46 70
           C 30 72, 16 62, 18 50
           C 10 48, 8 44, 16 42 Z"
        fill="#4A6FA5"
      />
      <text
        x="130"
        y="66"
        textAnchor="middle"
        fontFamily="'Baloo 2', 'Segoe UI', system-ui, sans-serif"
        fontWeight={700}
        fontSize="46"
        fill="#FFFFFF"
        letterSpacing="1"
      >
        gaia
      </text>
      <text
        x="130"
        y="132"
        textAnchor="middle"
        fontFamily="'Segoe UI', system-ui, sans-serif"
        fontWeight={400}
        fontSize="17"
        fill="#3E9B4F"
      >
        nourishment for life
      </text>
    </svg>
  );
}

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [permissions, setPermissions] = useState<PermissionMap>({})
  const [userName, setUserName] = useState("")
  const [userRole, setUserRole] = useState("")

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then(async (data) => {
        if (!data.success) return
        setUserName(data.name || data.email)
        setUserRole(data.role || "")

        // Fetch role permissions
        if (data.role === "admin") {
          // Admin sees everything
          const allAllowed: PermissionMap = {}
          ALL_PAGES.forEach((p) => { allAllowed[p.key] = true })
          setPermissions(allAllowed)
        } else {
          const res = await fetch("/api/admin/permissions")
          const pData = await res.json()
          if (pData.success && pData.permissions?.[data.role]) {
            setPermissions(pData.permissions[data.role])
          }
        }
      })
  }, [])

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
  }

  const visiblePages = ALL_PAGES.filter((p) => permissions[p.key])

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="group-data-[collapsible=icon]:px-1 group-data-[collapsible=icon]:py-3 px-4 pt-5 pb-3">
        <Link href="/" className="flex items-center justify-center">
          <GaiaLogo className="w-full h-auto max-w-[195px] group-data-[collapsible=icon]:max-w-[44px] transition-all duration-200" />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {visiblePages.map((page) => (
                <SidebarMenuItem key={page.href}>
                  <SidebarMenuButton
                    isActive={pathname === page.href}
                    tooltip={page.name}
                    render={
                      <Link href={page.href}>
                        <page.icon />
                        <span>{page.name}</span>
                      </Link>
                    }
                  />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="px-2 pb-4 space-y-1">
        {/* Profile link */}
        <SidebarMenuButton
          tooltip="Profile"
          render={
            <Link href="/settings">
              <User />
              <div className="flex flex-col leading-tight">
                <span className="text-xs font-semibold text-slate-700 truncate">{userName}</span>
                <span className="text-xs text-slate-400 capitalize">{userRole}</span>
              </div>
            </Link>
          }
        />
        {/* Logout */}
        <SidebarMenuButton
          tooltip="Logout"
          render={
            <button onClick={handleLogout} className="w-full flex items-center gap-2 text-red-500 hover:text-red-700">
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          }
        />
      </SidebarFooter>
    </Sidebar>
  )
}