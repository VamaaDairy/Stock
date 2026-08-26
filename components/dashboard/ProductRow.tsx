"use client"

import { Badge } from "@/components/ui/badge"
import { formatMixedUnit, calcUBDPercent, ubdPercentColor } from "@/lib/utils"
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
  const { opening, production, demand, sale, closing, hasEntry, unit, batchNumber, skuCode, expiryDate, ubd, manufacturingDate, shelfLifeDays } = product
  const totalAvailable = opening.total + production.total
  const salePct = totalAvailable > 0 ? Math.min((sale.total / totalAvailable) * 100, 100) : 0
  const closingPct = totalAvailable > 0 ? Math.max(100 - salePct, 0) : 0

  const ubdVal = ubd || expiryDate || null
  const ubdPct = calcUBDPercent(ubdVal, shelfLifeDays, manufacturingDate)

  // Expiry / UBD status helper
  const getExpiryBadge = () => {
    if (!ubdVal) return null

    return (
      <div className="flex items-center gap-1">
        {manufacturingDate && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-white text-neutral-700 border-neutral-300 font-medium">
            MFD: {manufacturingDate}
          </Badge>
        )}
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-white text-neutral-700 border-neutral-300 font-medium">
          UBD: {ubdVal}
        </Badge>
        {ubdPct !== null && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-neutral-50 border-neutral-300 font-extrabold">
            <span className={ubdPercentColor(ubdPct)}>
              {ubdPct <= 0 ? "EXPIRED" : `UBD: ${ubdPct.toFixed(1)}%`}
            </span>
          </Badge>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col md:flex-row md:items-center gap-4 py-4 px-1 border-b border-neutral-200 last:border-b-0 text-black">
      {/* Product Name & Identifiers */}
      <div className="flex-1 min-w-[200px]">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-base font-bold text-black">{product.name}</span>
          {skuCode ? (
            <Badge variant="outline" className="text-[11px] font-mono font-bold text-black border-neutral-300 bg-white">
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
              {batchNumber ? (
                <div className="flex flex-wrap gap-1">
                  {batchNumber.split(',').map((b, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs font-bold bg-white text-black border border-neutral-300">
                      Batch: {b.trim()}
                    </Badge>
                  ))}
                </div>
              ) : null}
              {getExpiryBadge()}
            </>
          ) : (
            <Badge variant="outline" className="text-xs font-medium border-neutral-300 text-neutral-500 bg-white">
              No entry for date
            </Badge>
          )}
        </div>
      </div>

      {/* Metrics & Current Stock Bar */}
      <div className="flex-[2.5] min-w-[280px]">
        <div className="grid grid-cols-4 gap-2 text-xs font-semibold [font-variant-numeric:tabular-nums] mb-1.5 text-black">
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500">Total Avail</span>
            <span className="text-sm font-bold text-black">{formatMixedUnit(totalAvailable, product.pcsPerCrt, unit, "PCS")}</span>
          </div>
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500">Demand</span>
            <span className="text-sm font-bold text-black">{formatMixedUnit(demand.total, product.pcsPerCrt, unit, "PCS")}</span>
          </div>
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500">Sale (Out)</span>
            <span className="text-sm font-bold text-black">{formatMixedUnit(sale.total, product.pcsPerCrt, unit, "PCS")}</span>
          </div>
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-black">Current Stock</span>
            <span className="text-base font-black text-black">
              {formatMixedUnit(closing.total, product.pcsPerCrt, unit, "PCS")}
            </span>
          </div>
        </div>

        {/* Visual Stock Bar (Neutral 300 for Sale, Black outline for Stock) */}
        <div className="h-2 rounded-full bg-neutral-200 overflow-hidden flex border border-neutral-400" title={`Dispatched: ${sale.total} ${unit} | Stock: ${closing.total} ${unit}`}>
          <div className="h-full bg-neutral-400 transition-all duration-300" style={{ width: `${salePct}%` }} />
          <div className="h-full bg-black transition-all duration-300" style={{ width: `${closingPct}%` }} />
        </div>
      </div>
    </div>
  )
}
