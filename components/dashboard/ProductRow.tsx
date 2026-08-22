"use client"

import { Badge } from "@/components/ui/badge"
import AddEntryModal from "./AddEntryModal"
import type { Product } from "./types"

export default function ProductRow({
  product,
  date,
  onSaved,
}: {
  product: Product
  date: string
  onSaved: () => void
}) {
  const { opening, production, demand, sale, closing, hasEntry, unit, batchNumber, skuCode, expiryDate, ubd } = product
  const totalAvailable = opening.total + production.total
  const salePct = totalAvailable > 0 ? Math.min((sale.total / totalAvailable) * 100, 100) : 0
  const closingPct = totalAvailable > 0 ? Math.max(100 - salePct, 0) : 0

  // Expiry status helper (Clean White / Light Monochrome)
  const getExpiryBadge = () => {
    const targetDate = expiryDate || ubd
    if (!targetDate) return null

    const today = new Date().getTime()
    const expTime = new Date(targetDate).getTime()
    const diffDays = Math.ceil((expTime - today) / (1000 * 3600 * 24))

    if (diffDays <= 0) {
      return <Badge variant="outline" className="border-2 border-black text-black text-[10px] px-1.5 py-0 uppercase tracking-wider font-extrabold bg-white">Expired ({targetDate})</Badge>
    } else if (diffDays <= 15) {
      return <Badge variant="outline" className="border-black text-black font-bold text-[10px] px-1.5 py-0 bg-neutral-100">Near Exp: {diffDays}d ({targetDate})</Badge>
    } else {
      return <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-white text-neutral-800 border-neutral-300">Exp: {targetDate}</Badge>
    }
  }

  return (
    <div className="flex flex-col md:flex-row md:items-center gap-4 py-4 px-1 border-b border-neutral-200 last:border-b-0 text-black">
      {/* Product Name & Identifiers */}
      <div className="flex-1 min-w-[200px]">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-base font-bold text-black">{product.name}</span>
          {skuCode ? (
            <Badge variant="outline" className="text-[11px] font-mono font-bold text-black border-black bg-white">
              {skuCode}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] font-mono text-neutral-400 border-neutral-300">
              No SKU
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {hasEntry ? (
            <>
              <Badge variant="outline" className="text-xs font-bold bg-white text-black border border-black">
                Batch: {batchNumber}
              </Badge>
              {getExpiryBadge()}
            </>
          ) : (
            <Badge variant="outline" className="text-xs font-medium border-black text-black bg-white">
              No entry yet
            </Badge>
          )}
        </div>
      </div>

      {/* Metrics & Current Stock Bar */}
      <div className="flex-[2.5] min-w-[280px]">
        <div className="grid grid-cols-4 gap-2 text-xs font-semibold [font-variant-numeric:tabular-nums] mb-1.5 text-black">
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500">Total Avail</span>
            <span className="text-sm font-bold text-black">{totalAvailable.toLocaleString()} {unit}</span>
          </div>
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500">Demand</span>
            <span className="text-sm font-bold text-black">{demand.total.toLocaleString()} {unit}</span>
          </div>
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500">Sale (Out)</span>
            <span className="text-sm font-bold text-black">{sale.total.toLocaleString()} {unit}</span>
          </div>
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-black">Current Stock</span>
            <span className="text-base font-black text-black">
              {closing.total.toLocaleString()} {unit}
            </span>
          </div>
        </div>

        {/* Visual Stock Bar (Neutral 300 for Sale, Black outline for Stock) */}
        <div className="h-2 rounded-full bg-neutral-200 overflow-hidden flex border border-neutral-400" title={`Dispatched: ${sale.total} ${unit} | Stock: ${closing.total} ${unit}`}>
          <div className="h-full bg-neutral-400 transition-all duration-300" style={{ width: `${salePct}%` }} />
          <div className="h-full bg-black transition-all duration-300" style={{ width: `${closingPct}%` }} />
        </div>
      </div>

      {/* Entry Action */}
      <div className="flex-shrink-0">
        <AddEntryModal product={product} date={date} onSaved={onSaved} />
      </div>
    </div>
  )
}
