'use client'

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Home, Info, LayoutDashboard, Settings, Package, Factory, ShoppingCart, Truck, User } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const pages = [
  { name: "Home", href: "/", icon: Home },
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Production", href: "/production", icon: Factory },
  { name: "Demand", href: "/demand", icon: ShoppingCart },
  { name: "Sales", href: "/sales", icon: Truck },
  { name: "Products", href: "/products", icon: Package },
  { name: "About", href: "/about", icon: Info },
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Profile", href: "/profile", icon: User },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Pages</SidebarGroupLabel>
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