'use client'
import Sidebar from './Sidebar'

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 h-full overflow-y-auto transition-all duration-300 ease-in-out">
        {children}
      </main>
    </div>
  )
}