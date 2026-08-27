"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import ProductFormModal from "./ProductFormModal"
import type { DBProduct } from "@/lib/db/products"

interface ProductListProps {
  products: DBProduct[]
  onRefresh: () => void
}

export function ProductList({ products, onRefresh }: ProductListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to remove "${name}" from products master?`)) return

    setDeletingId(id)
    try {
      const res = await fetch(`/api/products?id=${id}`, { method: "DELETE" })
      const json = await res.json()
      if (json.success) {
        onRefresh()
      } else {
        alert(json.error || "Failed to delete product")
      }
    } catch (e) {
      alert("Failed to delete product")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="border border-blue-100 rounded-xl overflow-hidden bg-white text-slate-800 shadow-xs">
      <table className="w-full text-left text-sm text-slate-800">
        <thead className="bg-blue-50 border-b border-blue-100 text-slate-800 text-xs uppercase font-bold tracking-wider">
          <tr>
            <th className="py-3.5 px-4">SKU Code</th>
            <th className="py-3.5 px-4">Product Name</th>
            <th className="py-3.5 px-4">Category</th>
            <th className="py-3.5 px-4">Tally Unit</th>
            <th className="py-3.5 px-4">Pack Config</th>
            <th className="py-3.5 px-4 text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-blue-100">
          {products.map((product) => (
            <tr key={product.id} className="hover:bg-blue-50/60 transition-colors">
              <td className="py-3 px-4 font-mono font-bold text-slate-800">
                {product.skuCode ? (
                  <Badge variant="outline" className="font-mono text-xs border-blue-200 bg-white text-slate-800">
                    {product.skuCode}
                  </Badge>
                ) : (
                  <span className="text-neutral-400 text-xs">—</span>
                )}
              </td>
              <td className="py-3 px-4 font-bold text-slate-800">{product.name}</td>
              <td className="py-3 px-4 text-slate-600 font-semibold">{product.category}</td>
              <td className="py-3 px-4 text-slate-800 font-bold uppercase">{product.unit}</td>
              <td className="py-3 px-4 font-mono text-xs font-semibold text-slate-500">
                {product.pcsPerCrt > 1 ? `1 ${product.unit} = ${product.pcsPerCrt} Pcs` : "1 Pc"}
              </td>
              <td className="py-3 px-4 text-center">
                <div className="flex items-center justify-center gap-2">
                  <ProductFormModal product={product} onSaved={onRefresh} />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2 text-slate-400 hover:text-red-600 hover:bg-red-50 border-none"
                    onClick={() => handleDelete(product.id, product.name)}
                    disabled={deletingId === product.id}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
