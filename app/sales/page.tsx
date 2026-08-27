"use client"

import React, { useState, useEffect, useCallback, useMemo, Fragment } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Truck, Filter, ChevronRight, ChevronDown } from "lucide-react"
import AddSalesModal from "@/components/sales/AddSalesModal"
import DatePeriodSelector, { PeriodSelection } from "@/components/ui/date-period-selector"
import { formatMixedUnit, calcUBDPercent, ubdPercentColor } from "@/lib/utils"
import type { CategoryGroup, Product } from "@/components/dashboard/types"
import { PageHeader } from "@/components/ui/page-header"

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export default function SalesPage() {
  const [period, setPeriod] = useState<PeriodSelection>({
    mode: "single",
    date: todayStr(),
    fromDate: todayStr(),
    toDate: todayStr(),
  })
  const [data, setData] = useState<CategoryGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedBatch, setSelectedBatch] = useState<string>("all")
  const [expandedProductIds, setExpandedProductIds] = useState<Set<string>>(new Set())

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

  const toggleProductExpand = (id: string) => {
    setExpandedProductIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const availableBatches = useMemo(() => {
    const batches = new Set<string>()
    data.forEach(group => {
      group.products.forEach(p => {
        if (p.batchNumber) {
          p.batchNumber.split(',').forEach(b => {
            const trimmed = b.trim()
            if (trimmed) batches.add(trimmed)
          })
        }
      })
    })
    return Array.from(batches).sort()
  }, [data])

  const allProducts = useMemo(() => {
    let list: (Product & { category: string })[] = []
    data.forEach(group => {
      group.products.forEach(p => {
        list.push({ ...p, category: group.category })
      })
    })

    if (selectedBatch !== "all") {
      list = list.filter(p => p.batchNumber && p.batchNumber.split(',').map(b => b.trim()).includes(selectedBatch))
    }

    if (!searchQuery.trim()) return list
    const q = searchQuery.toLowerCase().trim()
    return list.filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        p.skuCode.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.batchNumber && p.batchNumber.toLowerCase().includes(q))
    )
  }, [data, searchQuery, selectedBatch])

  const currentDateLabel = period.mode === "range" ? `${period.fromDate} to ${period.toDate}` : period.date

  return (
    <div className="flex flex-col flex-1 p-6 md:p-8 bg-white text-slate-800 min-h-screen">
      <div className="max-w-6xl mx-auto w-full space-y-6">
        
        {/* Header & Date Selector */}
        <PageHeader
          icon={Truck}
          title="Daily Sales Management (Dispatches)"
          subtitle={<>Showing Sales Entries for Date: <span className="font-bold text-slate-800">{currentDateLabel}</span></>}
          actions={<DatePeriodSelector value={period} onChange={setPeriod} />}
        />

        {/* Search & Batch Filter */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-800" />
            <Input
              placeholder="Search product name, SKU (e.g. 1011) or batch..."
              className="pl-10 h-11 bg-white text-base rounded-xl border-blue-200 text-slate-800 placeholder:text-slate-400"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          {availableBatches.length > 0 && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-bold text-slate-500 uppercase whitespace-nowrap flex items-center gap-1">
                <Filter className="h-3.5 w-3.5" /> Batch:
              </span>
              <select
                value={selectedBatch}
                onChange={e => setSelectedBatch(e.target.value)}
                className="h-11 px-3 text-sm font-semibold rounded-xl border border-blue-200 bg-white text-slate-800 focus:outline-none"
              >
                <option value="all">All Batches ({availableBatches.length})</option>
                {availableBatches.map(b => (
                  <option key={b} value={b}>Batch: {b}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Table */}
        {loading ? (
          <div className="bg-white p-12 rounded-xl border border-blue-100 text-center text-slate-800">
            <p className="text-base font-semibold animate-pulse">Loading sales data...</p>
          </div>
        ) : (
          <div className="border border-blue-100 rounded-xl overflow-hidden bg-white shadow-xs">
            <table className="w-full text-left text-sm">
              <thead className="bg-gradient-to-r from-blue-50 to-slate-50 text-[#2B4C86] text-xs uppercase font-bold tracking-wider border-b border-blue-100">
                <tr>
                  <th className="py-3.5 px-3 w-10 text-center"></th>
                  <th className="py-3.5 px-4">SKU Code</th>
                  <th className="py-3.5 px-4">Product Name</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4 text-right font-black text-slate-800">Total Sales Out</th>
                  <th className="py-3.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-100">
                {allProducts.map(p => {
                  const isExpanded = expandedProductIds.has(p.id)
                  const activeBatches = p.batchesList
                    ? p.batchesList.filter(b => (selectedBatch === "all" || b.batchNumber === selectedBatch) && (b.sale?.total ?? 0) > 0)
                    : []
                  const hasBatches = activeBatches.length > 0

                  return (
                    <Fragment key={p.id}>
                      {/* Main Summary Row */}
                      <tr
                        onClick={() => toggleProductExpand(p.id)}
                        className="hover:bg-blue-50/60 transition-colors cursor-pointer select-none"
                      >
                        <td className="py-3 px-3 text-center text-slate-400">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 mx-auto text-slate-800 font-bold" />
                          ) : (
                            <ChevronRight className="h-4 w-4 mx-auto text-neutral-400" />
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">
                          {p.skuCode ? (
                            <Badge variant="outline" className="border-blue-200 bg-blue-50/60 text-[#2B4C86] font-mono">
                              {p.skuCode}
                            </Badge>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800">
                          <div className="flex items-center gap-2">
                            <span>{p.name}</span>
                            {hasBatches && (
                              <span className="text-[10px] text-slate-400 font-semibold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                                {p.batchesList!.length} batch{p.batchesList!.length > 1 ? "es" : ""}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-semibold">{p.category}</td>
                        <td className="py-3 px-4 text-right font-black text-base text-slate-800">
                          {p.sale.total > 0 ? (
                            <div>
                              <span className="font-extrabold">{formatMixedUnit(p.sale.total, p.pcsPerCrt, p.unit || "CRT", "PCS")}</span>
                              {p.pcsPerCrt > 1 && (
                                <div className="text-[11px] font-semibold text-slate-400">
                                  ({p.sale.total.toLocaleString()} PCS)
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-neutral-400 font-normal">0 {p.unit}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center" onClick={e => e.stopPropagation()}>
                          <AddSalesModal product={p} date={period.date} onSaved={fetchData} />
                        </td>
                      </tr>

                      {/* Collapsible Batch Breakdown Dropdown Panel */}
                      {isExpanded && (
                        <tr className="bg-slate-50/80">
                          <td colSpan={6} className="p-0 border-b border-blue-100">
                            <div className="p-3 pl-12">
                              <div className="border border-blue-100 rounded-lg overflow-hidden bg-white shadow-2xs">
                                <table className="w-full text-left text-xs">
                                  <thead className="bg-gradient-to-r from-blue-50 to-slate-50 text-[#2B4C86] font-bold uppercase tracking-wider border-b border-blue-100">
                                    <tr>
                                      <th className="py-2.5 px-3">Batch No</th>
                                      <th className="py-2.5 px-3">MFD</th>
                                      <th className="py-2.5 px-3">UBD</th>
                                      <th className="py-2.5 px-3 text-center">UBD %</th>
                                      <th className="py-2.5 px-3 text-right font-black text-slate-800">Sale Out Quantity</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-blue-100">
                                    {hasBatches ? (
                                      activeBatches.map((b, idx) => {
                                        const ubdVal = b.ubd || b.expiryDate || null
                                        const pct = calcUBDPercent(ubdVal, b.shelfLifeDays || p.shelfLifeDays, b.manufacturingDate)
                                        return (
                                          <tr key={idx} className="hover:bg-slate-50">
                                            <td className="py-2 px-3 font-mono font-bold text-slate-800">
                                              <Badge variant="outline" className="border-blue-200 bg-blue-50/60 text-[#2B4C86] font-mono text-[11px]">
                                                {b.batchNumber}
                                              </Badge>
                                            </td>
                                            <td className="py-2 px-3 text-slate-500 font-medium">{b.manufacturingDate || "—"}</td>
                                            <td className="py-2 px-3 text-slate-500 font-medium">{ubdVal || "—"}</td>
                                            <td className="py-2 px-3 text-center">
                                              {pct === null ? (
                                                <span className="text-neutral-400 text-xs">—</span>
                                              ) : pct <= 0 ? (
                                                <span className="text-red-600 font-black text-xs bg-red-50 px-1.5 py-0.5 rounded">EXPIRED</span>
                                              ) : (
                                                <span className={`text-xs ${ubdPercentColor(pct)}`}>{pct.toFixed(1)}%</span>
                                              )}
                                            </td>
                                            <td className="py-2 px-3 text-right font-black text-sm text-slate-800">
                                              <div>
                                                <span className="font-extrabold">-{formatMixedUnit(b.sale.total, p.pcsPerCrt, p.unit || "CRT", "PCS")}</span>
                                                {p.pcsPerCrt > 1 && (
                                                  <div className="text-[10px] font-semibold text-neutral-400">
                                                    ({b.sale.total.toLocaleString()} PCS)
                                                  </div>
                                                )}
                                              </div>
                                            </td>
                                          </tr>
                                        )
                                      })
                                    ) : (
                                      <tr>
                                        <td colSpan={5} className="py-3 px-4 text-center text-slate-400 font-medium">
                                          No sales dispatch entry recorded for date {currentDateLabel}.
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
