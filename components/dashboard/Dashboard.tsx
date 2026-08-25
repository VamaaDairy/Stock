"use client"

import React, { useEffect, useState, useCallback, useMemo, Fragment } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Package, Filter, ChevronRight, ChevronDown } from "lucide-react"
import DatePeriodSelector, { PeriodSelection } from "@/components/ui/date-period-selector"
import type { CategoryGroup, Product } from "./types"

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

// UBD % = (days remaining until UBD / shelf life days) * 100
function calcUBDPercent(ubd: string | null, shelfLifeDays: number | null): number | null {
  if (!ubd || !shelfLifeDays || shelfLifeDays <= 0) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const ubdDate = new Date(ubd)
  ubdDate.setHours(0, 0, 0, 0)
  const daysLeft = Math.round((ubdDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  return Math.round((daysLeft / shelfLifeDays) * 1000) / 10 // 1 decimal
}

function ubdPercentColor(pct: number | null): string {
  if (pct === null) return "text-neutral-400"
  if (pct <= 0) return "text-red-600 font-black"
  if (pct < 50) return "text-red-500 font-bold"
  if (pct < 70) return "text-orange-500 font-bold"
  if (pct < 85) return "text-yellow-600 font-bold"
  return "text-green-600 font-bold"
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
  const [selectedBatch, setSelectedBatch] = useState<string>("all")
  const [expandedProductIds, setExpandedProductIds] = useState<Set<string>>(new Set())

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
    queueMicrotask(() => {
      fetchData()
    })
  }, [fetchData])

  const toggleProductExpand = (id: string) => {
    setExpandedProductIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Extract all unique batch numbers available across products
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

  // Flattened & filtered products list by search query and selected batch
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



        {/* Search & Batch Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-black" />
            <Input
              placeholder="Search by Product Name, SKU Code (e.g. 1011) or Batch..."
              className="pl-10 h-11 bg-white text-base rounded-xl border-neutral-300 text-black placeholder:text-neutral-500"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          {availableBatches.length > 0 && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-bold text-neutral-600 uppercase whitespace-nowrap flex items-center gap-1">
                <Filter className="h-3.5 w-3.5" /> Batch:
              </span>
              <select
                value={selectedBatch}
                onChange={e => setSelectedBatch(e.target.value)}
                className="h-11 px-3 text-sm font-semibold rounded-xl border border-neutral-300 bg-white text-black focus:outline-none"
              >
                <option value="all">All Batches ({availableBatches.length})</option>
                {availableBatches.map(b => (
                  <option key={b} value={b}>Batch: {b}</option>
                ))}
              </select>
            </div>
          )}
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
                  <th className="py-3.5 px-3 w-10 text-center"></th>
                  <th className="py-3.5 px-4">SKU Code</th>
                  <th className="py-3.5 px-4">Product Name</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4 text-right font-black text-black">Currently Available Stock</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {allProducts.map(p => {
                  const isExpanded = expandedProductIds.has(p.id)
                  const activeBatches = p.batchesList
                    ? p.batchesList.filter(b => b.closing.total > 0 || b.production.total > 0 || b.sale.total > 0)
                    : []
                  const hasBatches = activeBatches.length > 0

                  return (
                    <Fragment key={p.id}>
                      {/* Primary Summary Row */}
                      <tr
                        onClick={() => toggleProductExpand(p.id)}
                        className="hover:bg-neutral-50 transition-colors cursor-pointer select-none"
                      >
                        <td className="py-3 px-3 text-center text-neutral-500">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 mx-auto text-black font-bold" />
                          ) : (
                            <ChevronRight className="h-4 w-4 mx-auto text-neutral-400" />
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-black">
                          {p.skuCode ? (
                            <Badge variant="outline" className="border-neutral-300 text-black font-mono">
                              {p.skuCode}
                            </Badge>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="py-3 px-4 font-bold text-black">
                          <div className="flex items-center gap-2">
                            <span>{p.name}</span>
                            {hasBatches && (
                              <span className="text-[10px] text-neutral-500 font-semibold bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-200">
                                {p.batchesList!.length} batch{p.batchesList!.length > 1 ? "es" : ""}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-neutral-600 font-semibold">{p.category}</td>
                        <td className="py-3 px-4 text-right font-black text-base text-black">
                          {p.currentStock.toLocaleString()} {p.unit}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {p.currentStock > 0 ? (
                            <Badge variant="outline" className="border-neutral-300 text-black font-bold text-[10px]">IN STOCK</Badge>
                          ) : (
                            <Badge variant="outline" className="border-neutral-300 text-neutral-400 font-bold text-[10px]">ZERO STOCK</Badge>
                          )}
                        </td>
                      </tr>

                      {/* Collapsible Batch Breakdown Dropdown Panel */}
                      {isExpanded && (
                        <tr className="bg-neutral-50/80">
                          <td colSpan={6} className="p-0 border-b border-neutral-200">
                            <div className="p-3 pl-12">
                              <div className="border border-neutral-200 rounded-lg overflow-hidden bg-white shadow-2xs">
                                <table className="w-full text-left text-xs">
                                  <thead className="bg-neutral-100 text-black font-bold uppercase tracking-wider border-b border-neutral-200">
                                    <tr>
                                      <th className="py-2.5 px-3">Batch No</th>
                                      <th className="py-2.5 px-3">Mfg Date</th>
                                      <th className="py-2.5 px-3">UBD</th>
                                      <th className="py-2.5 px-3 text-center">UBD %</th>
                                      <th className="py-2.5 px-3 text-right font-black text-black">Available Stock</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-neutral-200">
                                    {hasBatches ? (
                                      activeBatches.map((b, idx) => {
                                        const ubdVal = b.ubd || b.expiryDate || null
                                        const pct = calcUBDPercent(ubdVal, b.shelfLifeDays)
                                        return (
                                        <tr key={idx} className="hover:bg-neutral-50">
                                          <td className="py-2 px-3 font-mono font-bold text-black">
                                            <Badge variant="outline" className="border-neutral-300 text-black font-mono text-[11px]">
                                              {b.batchNumber}
                                            </Badge>
                                          </td>
                                          <td className="py-2 px-3 text-neutral-600 font-medium">{b.manufacturingDate || "—"}</td>
                                          <td className="py-2 px-3 text-neutral-600 font-medium">{ubdVal || "—"}</td>
                                          <td className="py-2 px-3 text-center">
                                            {pct === null ? (
                                              <span className="text-neutral-400 text-xs">—</span>
                                            ) : pct <= 0 ? (
                                              <span className="text-red-600 font-black text-xs bg-red-50 px-1.5 py-0.5 rounded">EXPIRED</span>
                                            ) : (
                                              <span className={`text-xs ${ubdPercentColor(pct)}`}>{pct.toFixed(1)}%</span>
                                            )}
                                          </td>
                                          <td className="py-2 px-3 text-right font-black text-sm text-black">
                                            {b.closing.total.toLocaleString()} {p.unit}
                                          </td>
                                        </tr>
                                        )
                                      })
                                    ) : (
                                      <tr>
                                        <td colSpan={5} className="py-3 px-4 text-center text-neutral-500 font-medium">
                                          No individual batch entry recorded for this product.
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
