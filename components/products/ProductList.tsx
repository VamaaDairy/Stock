import type { Product } from "@/lib/data/products"
import { Badge } from "@/components/ui/badge"

interface ProductListProps {
  products: Product[]
}

export function ProductList({ products }: ProductListProps) {
  return (
    <div className="border border-black rounded-xl overflow-hidden bg-white text-black shadow-xs">
      <table className="w-full text-left text-sm text-black">
        <thead className="bg-neutral-100 border-b border-black text-black text-xs uppercase font-bold tracking-wider">
          <tr>
            <th className="py-3.5 px-4">SKU Code</th>
            <th className="py-3.5 px-4">Product Name</th>
            <th className="py-3.5 px-4">Category</th>
            <th className="py-3.5 px-4">Tally Unit</th>
            <th className="py-3.5 px-4">Pack Config</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200">
          {products.map((product) => (
            <tr key={product.id} className="hover:bg-neutral-50 transition-colors">
              <td className="py-3 px-4 font-mono font-bold text-black">
                {product.skuCode ? (
                  <Badge variant="outline" className="font-mono text-xs border-black bg-white text-black">
                    {product.skuCode}
                  </Badge>
                ) : (
                  <span className="text-neutral-400 text-xs">—</span>
                )}
              </td>
              <td className="py-3 px-4 font-bold text-black">{product.name}</td>
              <td className="py-3 px-4 text-neutral-700 font-semibold">{product.category}</td>
              <td className="py-3 px-4 text-black font-bold uppercase">{product.unit}</td>
              <td className="py-3 px-4 font-mono text-xs font-semibold text-neutral-600">
                {product.pcsPerCrt > 1 ? `1 ${product.unit} = ${product.pcsPerCrt} Pcs` : "1 Pc"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
