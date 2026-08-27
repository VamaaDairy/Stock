"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, ShoppingCart } from "lucide-react"
import AddDemandModal from "@/components/demand/AddDemandModal"
import DatePeriodSelector, { PeriodSelection } from "@/components/ui/date-period-selector"
import { formatMixedUnit } from "@/lib/utils"
import type { CategoryGroup, Product } from "@/components/dashboard/types"
import { PageHeader } from "@/components/ui/page-header"

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export default function DemandPage() {
  const [period, setPeriod] = useState<PeriodSelection>({
    mode: "single",
    date: todayStr(),
    fromDate: todayStr(),
    toDate: todayStr(),
  })
  const [data, setData] = useState<CategoryGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const fetchData = useCallback(() => setRefreshTrigger(prev => prev + 1), [])

  useEffect(() => {
    let ignore = false
    async function loadData() {
      try {
        const url =
          period.mode === "range"
            ? `/api/dashboard?fromDate=${period.fromDate}&toDate=${period.toDate}`
            : `/api/dashboard?date=${period.date}`
        const res = await fetch(url)
        const json = await res.json()
        if (!ignore && json.success) {
          setData(json.data)
        }
      } catch (e) {
        console.error(e)
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }
    loadData()
    return () => {
      ignore = true
    }
  }, [period, refreshTrigger])

  const allProducts = useMemo(() => {
    let list: (Product & { category: string })[] = []
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
        p.category.toLowerCase().includes(q)
    )
  }, [data, searchQuery])

  const currentDateLabel = period.mode === "range" ? `${period.fromDate} to ${period.toDate}` : period.date

  return (
    <div className="flex flex-col flex-1 p-6 md:p-8 bg-white text-slate-800 min-h-screen">
      <div className="max-w-6xl mx-auto w-full space-y-6">
        
        {/* Header & Date Selector */}
        <PageHeader
          icon={ShoppingCart}
          title="Daily Demand Management"
          subtitle={<>Showing Demand Entries for Date: <span className="font-bold text-slate-800">{currentDateLabel}</span></>}
          actions={<DatePeriodSelector value={period} onChange={setPeriod} />}
        />

        {/* Search Bar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-800" />
            <Input
              placeholder="Search product name, SKU Code (e.g. 1011) or Category..."
              className="pl-10 h-11 bg-white text-base rounded-xl border-blue-200 text-slate-800 placeholder:text-slate-400"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Demand Table */}
        {loading ? (
          <div className="bg-white p-12 rounded-xl border border-blue-100 text-center text-slate-800">
            <p className="text-base font-semibold animate-pulse">Loading demand data...</p>
          </div>
        ) : (
          <div className="border border-blue-100 rounded-xl overflow-hidden bg-white shadow-xs">
            <table className="w-full text-left text-sm">
              <thead className="bg-gradient-to-r from-blue-50 to-slate-50 text-[#2B4C86] text-xs uppercase font-bold tracking-wider border-b border-blue-100">
                <tr>
                  <th className="py-3.5 px-4">SKU Code</th>
                  <th className="py-3.5 px-4">Product Name</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4 text-right font-black text-slate-800">Total Demand</th>
                  <th className="py-3.5 px-4 text-right font-bold text-slate-800">Current Stock</th>
                  <th className="py-3.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-100">
                {allProducts.map(p => (
                  <tr key={p.id} className="hover:bg-blue-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {p.skuCode ? (
                        <Badge variant="outline" className="border-blue-200 bg-blue-50/60 text-[#2B4C86] font-mono">
                          {p.skuCode}
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">{p.name}</td>
                    <td className="py-3 px-4 text-slate-500 font-semibold">{p.category}</td>
                    <td className="py-3 px-4 text-right font-black text-base text-slate-800">
                      {p.demand.total > 0 ? (
                        <div>
                          <span className="font-extrabold">{formatMixedUnit(p.demand.total, p.pcsPerCrt, p.unit || "CRT", "PCS")}</span>
                          {p.pcsPerCrt > 1 && (
                            <div className="text-[11px] font-semibold text-slate-400">
                              ({p.demand.total.toLocaleString()} PCS)
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-neutral-400 font-normal">0 {p.unit}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-base text-slate-800">
                      <div>
                        <span className="font-extrabold">{formatMixedUnit(p.currentStockTotal ?? p.currentStock, p.pcsPerCrt, p.unit || "CRT", "PCS")}</span>
                        {p.pcsPerCrt > 1 && (
                          <div className="text-[11px] font-semibold text-slate-400">
                            ({(p.currentStockTotal ?? p.currentStock ?? 0).toLocaleString()} PCS)
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <AddDemandModal product={p} date={period.date} onSaved={fetchData} />
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
