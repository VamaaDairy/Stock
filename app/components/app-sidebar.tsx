'use client'

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Home, Info, LayoutDashboard, Settings, Package, Factory, Truck, RotateCcw, User } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const pages = [
  { name: "Home", href: "/", icon: Home },
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Production", href: "/production", icon: Factory },
  { name: "Sales", href: "/sales", icon: Truck },
  { name: "Sales Return", href: "/sales-return", icon: RotateCcw },
  { name: "Products", href: "/products", icon: Package },
  { name: "About", href: "/about", icon: Info },
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Profile", href: "/profile", icon: User },
]

function GaiaLogo({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 260 150"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Irregular blob/ribbon shape behind "gaia" only — organic, wavy, uneven edges */}
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
      {/* Tagline sits below and outside the blob shape */}
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
              {pages.map((page) => (
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
    </Sidebar>
  )
}