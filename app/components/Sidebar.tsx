'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'

const pages = [
  { name: 'Home', href: '/' },
  { name: 'About', href: '/about' },
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Settings', href: '/settings' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(true)

  return (
    <>
      {/* Toggle button - always visible */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 p-2 text-black hover:opacity-70 transition-opacity"
        aria-label="Toggle sidebar"
      >
        {isOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`h-full border-r border-black overflow-y-auto bg-white transition-all duration-300 ease-in-out ${
          isOpen ? 'w-[30%] opacity-100' : 'w-0 opacity-0'
        }`}
      >
        <nav className={`pt-16 px-4 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
          <h2 className="text-lg font-semibold mb-6 text-black whitespace-nowrap">Pages</h2>
          <ul className="space-y-1">
            {pages.map((page) => {
              const isActive = pathname === page.href
              return (
                <li key={page.href}>
                  <Link
                    href={page.href}
                    className={`flex items-center gap-3 pl-3 pr-4 py-2 text-sm whitespace-nowrap transition-all duration-200 border-l-2 ${
                      isActive
                        ? 'border-black font-medium text-black'
                        : 'border-transparent text-black/60 hover:border-black/40 hover:text-black'
                    }`}
                  >
                    {page.name}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </aside>
    </>
  )
}