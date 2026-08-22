"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { Accordion } from "@/components/ui/accordion"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search, Package, Factory, ShoppingCart, Truck, Layers } from "lucide-react"
import CategorySection from "./CategorySection"
import AddEntryModal from "./AddEntryModal"
import DatePeriodSelector, { PeriodSelection } from "@/components/ui/date-period-selector"
import type { CategoryGroup, Product } from "./types"

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

type TabType = "overview" | "stock" | "production" | "demand" | "sale"

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
  const [activeTab, setActiveTab] = useState<TabType>("overview")

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

  // Aggregate global KPIs dynamically by Unit
  const kpis = useMemo(() => {
    const stockByUnit: Record<string, number> = {}
    const prodByUnit: Record<string, number> = {}
    const demByUnit: Record<string, number> = {}
    const saleByUnit: Record<string, number> = {}

    data.forEach(group => {
      group.products.forEach(p => {
        const u = p.unit ? p.unit.toUpperCase() : "PCS"
        stockByUnit[u] = (stockByUnit[u] || 0) + (p.currentStock || 0)
        prodByUnit[u] = (prodByUnit[u] || 0) + (p.production.total || 0)
        demByUnit[u] = (demByUnit[u] || 0) + (p.demand.total || 0)
        saleByUnit[u] = (saleByUnit[u] || 0) + (p.sale.total || 0)
      })
    })

    return { stockByUnit, prodByUnit, demByUnit, saleByUnit }
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

  // Filtered categories based on search
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return data

    const query = searchQuery.toLowerCase().trim()
    return data
      .map(group => ({
        ...group,
        products: group.products.filter(
          p =>
            p.name.toLowerCase().includes(query) ||
            p.skuCode.toLowerCase().includes(query) ||
            (p.batchNumber && p.batchNumber.toLowerCase().includes(query))
        ),
      }))
      .filter(group => group.products.length > 0)
  }, [data, searchQuery])

  const renderUnitSummary = (unitMap: Record<string, number>) => {
    const entries = Object.entries(unitMap).filter(([_, val]) => val > 0)
    if (entries.length === 0) return <p className="text-sm font-bold text-black">0</p>

    return (
      <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5">
        {entries.map(([unit, count]) => (
          <span key={unit} className="text-sm font-bold text-black">
            {count.toLocaleString()} <span className="text-[10px] font-medium uppercase text-neutral-500">{unit}</span>
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
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-black shadow-xs">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-black">
              Inventory & Production Dashboard
            </h1>
            <p className="text-xs text-neutral-600 mt-1">
              Showing Data for: <span className="font-bold text-black">{currentDateLabel}</span>
            </p>
          </div>
          <div className="self-start lg:self-auto">
            <DatePeriodSelector value={period} onChange={setPeriod} />
          </div>
        </div>

        {/* Dashboard Navbar / Separate Section Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-black">
          <Button
            variant="ghost"
            onClick={() => setActiveTab("overview")}
            className={`h-11 px-5 font-black text-sm rounded-none border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "overview"
                ? "border-black text-black bg-white font-black"
                : "border-transparent text-neutral-500 hover:text-black hover:bg-neutral-50"
            }`}
          >
            <Layers className="h-4 w-4" />
            Overview
          </Button>

          <Button
            variant="ghost"
            onClick={() => setActiveTab("stock")}
            className={`h-11 px-5 font-black text-sm rounded-none border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "stock"
                ? "border-black text-black bg-white font-black"
                : "border-transparent text-neutral-500 hover:text-black hover:bg-neutral-50"
            }`}
          >
            <Package className="h-4 w-4" />
            Current Stock
          </Button>

          <Button
            variant="ghost"
            onClick={() => setActiveTab("production")}
            className={`h-11 px-5 font-black text-sm rounded-none border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "production"
                ? "border-black text-black bg-white font-black"
                : "border-transparent text-neutral-500 hover:text-black hover:bg-neutral-50"
            }`}
          >
            <Factory className="h-4 w-4" />
            Daily Production
          </Button>

          <Button
            variant="ghost"
            onClick={() => setActiveTab("demand")}
            className={`h-11 px-5 font-black text-sm rounded-none border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "demand"
                ? "border-black text-black bg-white font-black"
                : "border-transparent text-neutral-500 hover:text-black hover:bg-neutral-50"
            }`}
          >
            <ShoppingCart className="h-4 w-4" />
            Daily Demand
          </Button>

          <Button
            variant="ghost"
            onClick={() => setActiveTab("sale")}
            className={`h-11 px-5 font-black text-sm rounded-none border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "sale"
                ? "border-black text-black bg-white font-black"
                : "border-transparent text-neutral-500 hover:text-black hover:bg-neutral-50"
            }`}
          >
            <Truck className="h-4 w-4" />
            Daily Sale
          </Button>
        </div>

        {/* Global Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-black" />
          <Input
            placeholder="Search by Product Name, SKU Code (e.g. 1011) or Batch..."
            className="pl-10 h-11 bg-white text-base rounded-xl border-black text-black placeholder:text-neutral-500"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="bg-white p-12 rounded-xl border border-black text-center text-black">
            <p className="text-base font-semibold animate-pulse">Loading inventory data...</p>
          </div>
        ) : (
          <>
            {/* TAB 1: OVERVIEW */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Global KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-black shadow-xs flex items-center gap-3.5 cursor-pointer hover:bg-neutral-50 transition-colors" onClick={() => setActiveTab("stock")}>
                    <div className="p-3 bg-white border border-black rounded-xl text-black">
                      <Package className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">Current Stock</p>
                      {renderUnitSummary(kpis.stockByUnit)}
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-black shadow-xs flex items-center gap-3.5 cursor-pointer hover:bg-neutral-50 transition-colors" onClick={() => setActiveTab("production")}>
                    <div className="p-3 bg-white border border-black rounded-xl text-black">
                      <Factory className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">Production</p>
                      {renderUnitSummary(kpis.prodByUnit)}
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-black shadow-xs flex items-center gap-3.5 cursor-pointer hover:bg-neutral-50 transition-colors" onClick={() => setActiveTab("demand")}>
                    <div className="p-3 bg-white border border-black rounded-xl text-black">
                      <ShoppingCart className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">Demand</p>
                      {renderUnitSummary(kpis.demByUnit)}
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-black shadow-xs flex items-center gap-3.5 cursor-pointer hover:bg-neutral-50 transition-colors" onClick={() => setActiveTab("sale")}>
                    <div className="p-3 bg-white border border-black rounded-xl text-black">
                      <Truck className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">Sale (Out)</p>
                      {renderUnitSummary(kpis.saleByUnit)}
                    </div>
                  </div>
                </div>

                {/* All Categories Accordion */}
                {filteredCategories.length === 0 ? (
                  <div className="bg-white p-12 rounded-xl border border-black text-center text-black">
                    <p className="text-base font-semibold">No products found matching "{searchQuery}"</p>
                  </div>
                ) : (
                  <Accordion multiple className="flex flex-col gap-3">
                    {filteredCategories.map(group => (
                      <CategorySection key={group.category} group={group} date={period.date} onSaved={fetchData} />
                    ))}
                  </Accordion>
                )}
              </div>
            )}

            {/* TAB 2: CURRENT STOCK FOCUSED SECTION */}
            {activeTab === "stock" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-white text-black border border-black p-4 rounded-xl">
                  <div>
                    <h2 className="text-xl font-black">Current Stock Inventory</h2>
                    <p className="text-xs text-neutral-600">Period: {currentDateLabel}</p>
                  </div>
                  <Badge variant="outline" className="border-black text-black font-bold">
                    Total {allProducts.length} Items
                  </Badge>
                </div>

                <div className="border border-black rounded-xl overflow-hidden bg-white shadow-xs">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-neutral-100 text-black text-xs uppercase font-bold tracking-wider border-b border-black">
                      <tr>
                        <th className="py-3.5 px-4">SKU</th>
                        <th className="py-3.5 px-4">Product Name</th>
                        <th className="py-3.5 px-4">Category</th>
                        <th className="py-3.5 px-4">Batch No</th>
                        <th className="py-3.5 px-4 text-right">Opening</th>
                        <th className="py-3.5 px-4 text-right">Production (+)</th>
                        <th className="py-3.5 px-4 text-right">Sale (-)</th>
                        <th className="py-3.5 px-4 text-right font-black">Current Stock</th>
                        <th className="py-3.5 px-4 text-center">Status</th>
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
                              <Badge variant="outline" className="border-black text-black font-mono">
                                {p.batchNumber}
                              </Badge>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-medium">{p.opening.total.toLocaleString()} {p.unit}</td>
                          <td className="py-3 px-4 text-right font-medium">{p.production.total.toLocaleString()} {p.unit}</td>
                          <td className="py-3 px-4 text-right font-medium">{p.sale.total.toLocaleString()} {p.unit}</td>
                          <td className="py-3 px-4 text-right font-black text-base">
                            {p.currentStock.toLocaleString()} {p.unit}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {p.currentStock > 0 ? (
                              <Badge variant="outline" className="border-black text-black font-bold text-[10px]">IN STOCK</Badge>
                            ) : (
                              <Badge variant="outline" className="border-neutral-300 text-neutral-400 font-bold text-[10px]">ZERO STOCK</Badge>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <AddEntryModal product={p} date={period.date} onSaved={fetchData} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: DAILY PRODUCTION FOCUSED SECTION */}
            {activeTab === "production" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-white text-black border border-black p-4 rounded-xl">
                  <div>
                    <h2 className="text-xl font-black">Daily Production Section</h2>
                    <p className="text-xs text-neutral-600">Period: {currentDateLabel}</p>
                  </div>
                  <Badge variant="outline" className="border-black text-black font-bold">
                    Period: {currentDateLabel}
                  </Badge>
                </div>

                <div className="border border-black rounded-xl overflow-hidden bg-white shadow-xs">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-neutral-100 text-black text-xs uppercase font-bold tracking-wider border-b border-black">
                      <tr>
                        <th className="py-3.5 px-4">SKU</th>
                        <th className="py-3.5 px-4">Product Name</th>
                        <th className="py-3.5 px-4">Batch No</th>
                        <th className="py-3.5 px-4">Mfg Date</th>
                        <th className="py-3.5 px-4 text-right">Crt / Box</th>
                        <th className="py-3.5 px-4 text-right">Pcs</th>
                        <th className="py-3.5 px-4 text-right font-black">Total Produced</th>
                        <th className="py-3.5 px-4 text-center">Update</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {allProducts.map(p => (
                        <tr key={p.id} className="hover:bg-neutral-50 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-black">
                            {p.skuCode || "—"}
                          </td>
                          <td className="py-3 px-4 font-bold text-black">{p.name}</td>
                          <td className="py-3 px-4 font-mono font-semibold">
                            {p.batchNumber ? (
                              <Badge variant="outline" className="border-black text-black font-mono">
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
                            <AddEntryModal product={p} date={period.date} onSaved={fetchData} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 4: DAILY DEMAND FOCUSED SECTION */}
            {activeTab === "demand" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-white text-black border border-black p-4 rounded-xl">
                  <div>
                    <h2 className="text-xl font-black">Daily Demand Section</h2>
                    <p className="text-xs text-neutral-600">Period: {currentDateLabel}</p>
                  </div>
                  <Badge variant="outline" className="border-black text-black font-bold">
                    Period: {currentDateLabel}
                  </Badge>
                </div>

                <div className="border border-black rounded-xl overflow-hidden bg-white shadow-xs">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-neutral-100 text-black text-xs uppercase font-bold tracking-wider border-b border-black">
                      <tr>
                        <th className="py-3.5 px-4">SKU</th>
                        <th className="py-3.5 px-4">Product Name</th>
                        <th className="py-3.5 px-4">Category</th>
                        <th className="py-3.5 px-4">Batch No</th>
                        <th className="py-3.5 px-4 text-right">Demand Crt</th>
                        <th className="py-3.5 px-4 text-right">Demand Pc</th>
                        <th className="py-3.5 px-4 text-right font-black">Total Demand</th>
                        <th className="py-3.5 px-4 text-right">Current Stock</th>
                        <th className="py-3.5 px-4 text-center">Update</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {allProducts.map(p => (
                        <tr key={p.id} className="hover:bg-neutral-50 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-black">
                            {p.skuCode || "—"}
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
                          <td className="py-3 px-4 text-right font-semibold">{p.demand.crt}</td>
                          <td className="py-3 px-4 text-right font-semibold">{p.demand.pc}</td>
                          <td className="py-3 px-4 text-right font-black text-base">
                            {p.demand.total.toLocaleString()} {p.unit}
                          </td>
                          <td className="py-3 px-4 text-right font-bold">
                            {p.currentStock.toLocaleString()} {p.unit}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <AddEntryModal product={p} date={period.date} onSaved={fetchData} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 5: DAILY SALE FOCUSED SECTION */}
            {activeTab === "sale" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-white text-black border border-black p-4 rounded-xl">
                  <div>
                    <h2 className="text-xl font-black">Daily Sale Section (Dispatches)</h2>
                    <p className="text-xs text-neutral-600">Period: {currentDateLabel}</p>
                  </div>
                  <Badge variant="outline" className="border-black text-black font-bold">
                    Period: {currentDateLabel}
                  </Badge>
                </div>

                <div className="border border-black rounded-xl overflow-hidden bg-white shadow-xs">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-neutral-100 text-black text-xs uppercase font-bold tracking-wider border-b border-black">
                      <tr>
                        <th className="py-3.5 px-4">SKU</th>
                        <th className="py-3.5 px-4">Product Name</th>
                        <th className="py-3.5 px-4">Batch No</th>
                        <th className="py-3.5 px-4 text-right">Sale Crt</th>
                        <th className="py-3.5 px-4 text-right">Sale Pc</th>
                        <th className="py-3.5 px-4 text-right font-black">Total Sale</th>
                        <th className="py-3.5 px-4 text-right">Sales Target</th>
                        <th className="py-3.5 px-4 text-right font-bold">Remaining Stock</th>
                        <th className="py-3.5 px-4 text-center">Update</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {allProducts.map(p => (
                        <tr key={p.id} className="hover:bg-neutral-50 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-black">
                            {p.skuCode || "—"}
                          </td>
                          <td className="py-3 px-4 font-bold text-black">{p.name}</td>
                          <td className="py-3 px-4 font-mono font-semibold">
                            {p.batchNumber ? (
                              <Badge variant="outline" className="border-black text-black font-mono">
                                {p.batchNumber}
                              </Badge>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-semibold">{p.sale.crt}</td>
                          <td className="py-3 px-4 text-right font-semibold">{p.sale.pc}</td>
                          <td className="py-3 px-4 text-right font-black text-base">
                            {p.sale.total.toLocaleString()} {p.unit}
                          </td>
                          <td className="py-3 px-4 text-right font-semibold">{p.salesTarget ? `${p.salesTarget.toLocaleString()} ${p.unit}` : "—"}</td>
                          <td className="py-3 px-4 text-right font-black text-base">
                            {p.currentStock.toLocaleString()} {p.unit}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <AddEntryModal product={p} date={period.date} onSaved={fetchData} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
