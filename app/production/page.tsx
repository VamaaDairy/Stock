"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Factory } from "lucide-react"
import AddProductionModal from "@/components/production/AddProductionModal"
import DatePeriodSelector, { PeriodSelection } from "@/components/ui/date-period-selector"
import type { CategoryGroup, Product } from "@/components/dashboard/types"

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export default function ProductionPage() {
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

  const currentDateLabel = period.mode === "range" ? `${period.fromDate} to ${period.toDate}` : period.date

  return (
    <div className="flex flex-col flex-1 p-6 md:p-8 bg-white text-black min-h-screen">
      <div className="max-w-6xl mx-auto w-full space-y-6">
        
        {/* Header & Date Selector */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-black shadow-xs">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-black flex items-center gap-2">
              <Factory className="h-8 w-8" />
              Daily Production Management
            </h1>
            <p className="text-xs text-neutral-600 mt-1">
              Period: <span className="font-bold text-black">{currentDateLabel}</span>
            </p>
          </div>
          <div className="self-start lg:self-auto">
            <DatePeriodSelector value={period} onChange={setPeriod} />
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-black" />
          <Input
            placeholder="Search product name, SKU (e.g. 1011) or batch code..."
            className="pl-10 h-11 bg-white text-base rounded-xl border-black text-black placeholder:text-neutral-500"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Table */}
        {loading ? (
          <div className="bg-white p-12 rounded-xl border border-black text-center text-black">
            <p className="text-base font-semibold animate-pulse">Loading production data...</p>
          </div>
        ) : (
          <div className="border border-black rounded-xl overflow-hidden bg-white shadow-xs">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-100 text-black text-xs uppercase font-bold tracking-wider border-b border-black">
                <tr>
                  <th className="py-3.5 px-4">SKU Code</th>
                  <th className="py-3.5 px-4">Product Name</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Batch No</th>
                  <th className="py-3.5 px-4">Mfg Date</th>
                  <th className="py-3.5 px-4 text-right">Crt / Box</th>
                  <th className="py-3.5 px-4 text-right">Pcs</th>
                  <th className="py-3.5 px-4 text-right font-black">Total Output</th>
                  <th className="py-3.5 px-4 text-center">Action</th>
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
                        <Badge variant="outline" className="border-black text-black">
                          {p.batchNumber}
                        </Badge>
                      ) : (
                        "Not entered"
                      )}
                    </td>
                    <td className="py-3 px-4 text-neutral-600 font-medium">{p.manufacturingDate || "—"}</td>
                    <td className="py-3 px-4 text-right font-semibold">{p.production.crt}</td>
                    <td className="py-3 px-4 text-right font-semibold">{p.production.pc}</td>
                    <td className="py-3 px-4 text-right font-black text-base">
                      {p.production.total.toLocaleString()} {p.unit}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <AddProductionModal product={p} date={period.date} onSaved={fetchData} />
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
