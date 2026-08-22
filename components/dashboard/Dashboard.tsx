"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Package } from "lucide-react"
import DatePeriodSelector, { PeriodSelection } from "@/components/ui/date-period-selector"
import type { CategoryGroup, Product } from "./types"

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export default function Dashboard() {
  const [period, setPeriod] = useState<PeriodSelection>({
    mode: "single",
    date: todayStr(),
    fromDate: todayStr(),
    toDate: todayStr(),
  })
  const [data, setData] = useState<CategoryGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const url =
        period.mode === "range"
          ? `/api/dashboard?fromDate=${period.fromDate}&toDate=${period.toDate}`
          : `/api/dashboard?date=${period.date}`
      const res = await fetch(url)
      const json = await res.json()
      if (json.success) setData(json.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Aggregate global Current Stock KPIs by Unit
  const stockByUnit = useMemo(() => {
    const summary: Record<string, number> = {}
    data.forEach(group => {
      group.products.forEach(p => {
        const u = p.unit ? p.unit.toUpperCase() : "PCS"
        summary[u] = (summary[u] || 0) + (p.currentStock || 0)
      })
    })
    return summary
  }, [data])

  // Flattened & filtered products list
  const allProducts = useMemo(() => {
    const list: (Product & { category: string })[] = []
    data.forEach(group => {
      group.products.forEach(p => {
        list.push({ ...p, category: group.category })
      })
    })

    if (!searchQuery.trim()) return list
    const q = searchQuery.toLowerCase().trim()
    return list.filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        p.skuCode.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.batchNumber && p.batchNumber.toLowerCase().includes(q))
    )
  }, [data, searchQuery])

  const renderUnitSummary = (unitMap: Record<string, number>) => {
    const entries = Object.entries(unitMap).filter(([_, val]) => val > 0)
    if (entries.length === 0) return <p className="text-sm font-bold text-black">0</p>

    return (
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
        {entries.map(([unit, count]) => (
          <span key={unit} className="text-base font-black text-black">
            {count.toLocaleString()} <span className="text-xs font-bold uppercase text-neutral-500">{unit}</span>
          </span>
        ))}
      </div>
    )
  }

  const currentDateLabel = period.mode === "range" ? `${period.fromDate} to ${period.toDate}` : period.date

  return (
    <div className="min-h-screen bg-white text-black px-4 py-6 pb-20">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Top Header & Period Selector */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-black flex items-center gap-2">
              <Package className="h-8 w-8" />
              Current Stock Inventory
            </h1>
            <p className="text-xs text-neutral-600 mt-1">
              Live Stock Balance = Opening + Production − Sale Dispatches (<span className="font-bold text-black">{currentDateLabel}</span>)
            </p>
          </div>
          <div className="self-start lg:self-auto">
            <DatePeriodSelector value={period} onChange={setPeriod} />
          </div>
        </div>

        {/* Global Current Stock Summary Card */}
        <div className="bg-white p-5 rounded-xl border border-black shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">Total Live Stock Summary</p>
            {renderUnitSummary(stockByUnit)}
          </div>
          <Badge variant="outline" className="border-neutral-300 text-black font-mono font-bold text-xs self-start sm:self-auto">
            {allProducts.length} Items Listed
          </Badge>
        </div>

        {/* Global Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-black" />
          <Input
            placeholder="Search by Product Name, SKU Code (e.g. 1011) or Batch..."
            className="pl-10 h-11 bg-white text-base rounded-xl border-neutral-300 text-black placeholder:text-neutral-500"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Current Stock Inventory Table */}
        {loading ? (
          <div className="bg-white p-12 rounded-xl border border-neutral-200 text-center text-black">
            <p className="text-base font-semibold animate-pulse">Loading current stock data...</p>
          </div>
        ) : (
          <div className="border border-neutral-200 rounded-xl overflow-hidden bg-white shadow-xs">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-100 text-black text-xs uppercase font-bold tracking-wider border-b border-neutral-200">
                <tr>
                  <th className="py-3.5 px-4">SKU Code</th>
                  <th className="py-3.5 px-4">Product Name</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Batch No</th>
                  <th className="py-3.5 px-4 text-right">Opening</th>
                  <th className="py-3.5 px-4 text-right">Production (+)</th>
                  <th className="py-3.5 px-4 text-right">Sale Out (-)</th>
                  <th className="py-3.5 px-4 text-right font-black text-black">Current Stock</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {allProducts.map(p => (
                  <tr key={p.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-black">
                      {p.skuCode ? (
                        <Badge variant="outline" className="border-black text-black font-mono">
                          {p.skuCode}
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-3 px-4 font-bold text-black">{p.name}</td>
                    <td className="py-3 px-4 text-neutral-600 font-semibold">{p.category}</td>
                    <td className="py-3 px-4 font-mono font-semibold">
                      {p.batchNumber ? (
                        <Badge variant="outline" className="border-black text-black font-mono">
                          {p.batchNumber}
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-neutral-600">{p.opening.total.toLocaleString()} {p.unit}</td>
                    <td className="py-3 px-4 text-right font-medium text-neutral-800">{p.production.total.toLocaleString()} {p.unit}</td>
                    <td className="py-3 px-4 text-right font-medium text-neutral-800">{p.sale.total.toLocaleString()} {p.unit}</td>
                    <td className="py-3 px-4 text-right font-black text-base text-black">
                      {p.currentStock.toLocaleString()} {p.unit}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {p.currentStock > 0 ? (
                        <Badge variant="outline" className="border-black text-black font-bold text-[10px]">IN STOCK</Badge>
                      ) : (
                        <Badge variant="outline" className="border-neutral-300 text-neutral-400 font-bold text-[10px]">ZERO STOCK</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
