"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { ProductList } from "@/components/products/ProductList"
import ProductFormModal from "@/components/products/ProductFormModal"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Package } from "lucide-react"
import type { DBProduct } from "@/lib/db/products"
import { PageHeader } from "@/components/ui/page-header"

export default function ProductsPage() {
  const [products, setProducts] = useState<DBProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/products")
      const json = await res.json()
      if (json.success) {
        setProducts(json.data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products
    const q = searchQuery.toLowerCase().trim()
    return products.filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        p.skuCode.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    )
  }, [products, searchQuery])

  return (
    <div className="flex flex-col flex-1 p-6 md:p-8 bg-white text-slate-800 min-h-screen">
      <div className="max-w-6xl mx-auto w-full space-y-6">
        
        {/* Header & Add Product Modal */}
        <PageHeader
          icon={Package}
          title="Products Master Management"
          subtitle="Add, update, or remove master products. All app views dynamically reference this list."
          actions={
            <div className="flex items-center gap-3 self-start sm:self-auto">
              <Badge variant="outline" className="border-blue-200 bg-blue-50/60 text-[#2B4C86] font-mono font-bold text-xs">
                Total: {products.length} Products
              </Badge>
              <ProductFormModal onSaved={fetchProducts} />
            </div>
          }
        />

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-800" />
          <Input
            placeholder="Search by Product Name, SKU Code (e.g. 1003) or Category..."
            className="pl-10 h-11 bg-white text-base rounded-xl border-blue-200 text-slate-800 placeholder:text-slate-400"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Product List Table */}
        {loading ? (
          <div className="bg-white p-12 rounded-xl border border-blue-100 text-center text-slate-800">
            <p className="text-base font-semibold animate-pulse">Loading products master...</p>
          </div>
        ) : (
          <ProductList products={filteredProducts} onRefresh={fetchProducts} />
        )}
      </div>
    </div>
  )
}
