"use client"
import { usePathname } from "next/navigation"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "./app-sidebar"

const PUBLIC_ROUTES = ["/login", "/signup"]

export default function ConditionalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isPublic = PUBLIC_ROUTES.some(r => pathname.startsWith(r))

  if (isPublic) {
    return <main className="flex-1 bg-white text-slate-800 min-h-screen">{children}</main>
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 bg-white text-slate-800">
        <SidebarTrigger />
        {children}
      </main>
    </SidebarProvider>
  )
}
