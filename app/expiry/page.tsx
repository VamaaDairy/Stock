"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search, AlertTriangle, Package, CalendarX, FileSpreadsheet, RefreshCw, Layers } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { exportToExcel } from "@/lib/excel-export"
import type { ExpiredStockItem } from "@/lib/db/expiry"

export default function ExpiryPage() {
  const [items, setItems] = useState<ExpiredStockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/stock/expiry")
      const json = await res.json()
      if (json.success) {
        setItems(json.data || [])
      }
    } catch (e) {
      console.error("Failed to load expired stock:", e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData, refreshTrigger])

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items
    const q = searchQuery.toLowerCase().trim()
    return items.filter(
      (item) =>
        item.productName.toLowerCase().includes(q) ||
        item.skuCode.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.batchNumber.toLowerCase().includes(q)
    )
  }, [items, searchQuery])

  // Summary Metrics
  const totalExpiredPieces = useMemo(() => {
    return items.reduce((sum, item) => sum + item.expiredQtyTotal, 0)
  }, [items])

  const uniqueCategories = useMemo(() => {
    return new Set(items.map((i) => i.category)).size
  }, [items])

  const handleExportExcel = () => {
    const headers = [
      "Category",
      "Product ID",
      "SKU Code",
      "Product Name",
      "Batch No",
      "MFD",
      "UBD / Expiry Date",
      "Days Expired",
      "Unit",
      "Pcs/Crt",
      "Expired Qty (Mixed)",
      "Expired Qty (Total PCS)",
      "Status",
      "Detected At",
    ]

    const rows = filteredItems.map((item) => [
      item.category,
      item.productId,
      item.skuCode,
      item.productName,
      item.batchNumber,
      item.manufacturingDate || "",
      item.ubd || item.expiryDate || "",
      `${item.daysExpired} days`,
      item.unit,
      item.pcsPerCrt,
      item.expiredQtyDisplay,
      item.expiredQtyTotal,
      "Removed from Active Stock",
      item.detectedAt,
    ])

    exportToExcel({
      filename: `Gaia_Expired_Stock_${new Date().toISOString().slice(0, 10)}`,
      sheetTitle: "Expired Stock Inventory Log",
      headers,
      rows,
    })
  }

  return (
    <div className="flex flex-col flex-1 p-6 md:p-8 bg-white text-slate-800 min-h-screen">
      <div className="max-w-6xl mx-auto w-full space-y-6">
        {/* Page Header */}
        <PageHeader
          icon={AlertTriangle}
          title="Expired Stock & Waste Log"
          subtitle="Batches that have reached or passed their Use Before Date (UBD). Automatically recorded in DB and removed from active stock balance."
          actions={
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                onClick={handleExportExcel}
                disabled={items.length === 0}
                className="flex items-center gap-2 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-800 border border-emerald-200 text-xs font-semibold px-3 py-2 h-9 rounded-lg transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Export Excel</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRefreshTrigger((prev) => prev + 1)}
                className="h-9 px-3 text-xs border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1" />
                Refresh
              </Button>
            </div>
          }
        />

        {/* Summary Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-red-50/70 border border-red-200 rounded-xl p-4 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-lg bg-red-100 flex items-center justify-center text-red-600 shrink-0">
              <CalendarX className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold text-red-600 uppercase tracking-wider">
                Expired Batches
              </div>
              <div className="text-2xl font-black text-red-950 mt-0.5">
                {items.length} <span className="text-xs font-semibold text-red-700">batch{items.length !== 1 ? "es" : ""}</span>
              </div>
            </div>
          </div>

          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                Total Expired Units
              </div>
              <div className="text-2xl font-black text-amber-950 mt-0.5">
                {totalExpiredPieces.toLocaleString()} <span className="text-xs font-semibold text-amber-800">PCS total</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-lg bg-slate-200 flex items-center justify-center text-slate-700 shrink-0">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Categories Affected
              </div>
              <div className="text-2xl font-black text-slate-900 mt-0.5">
                {uniqueCategories} <span className="text-xs font-semibold text-slate-500">categories</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search by Product Name, SKU, Batch No, or Category..."
            className="pl-10 h-11 bg-white text-sm rounded-xl border-blue-200 text-slate-800 placeholder:text-slate-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Expired Stock Table */}
        {loading ? (
          <div className="bg-white p-12 rounded-xl border border-blue-100 text-center text-slate-600">
            <p className="text-sm font-semibold animate-pulse">Scanning and loading expired stock data...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-12 text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
              ✓
            </div>
            <h3 className="text-base font-bold text-emerald-900">No Expired Stock Found!</h3>
            <p className="text-xs text-emerald-700 max-w-md mx-auto">
              All batches in the system are currently fresh and within their Use Before Date (UBD).
            </p>
          </div>
        ) : (
          <div className="border border-red-200 rounded-xl overflow-hidden bg-white shadow-xs">
            <table className="w-full text-left text-sm">
              <thead className="bg-gradient-to-r from-red-50 to-orange-50 text-red-900 text-xs uppercase font-bold tracking-wider border-b border-red-200">
                <tr>
                  <th className="py-3.5 px-4">SKU</th>
                  <th className="py-3.5 px-4">Product Name</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Batch No</th>
                  <th className="py-3.5 px-4">MFD</th>
                  <th className="py-3.5 px-4">UBD</th>
                  <th className="py-3.5 px-4">Expiry Status</th>
                  <th className="py-3.5 px-4 text-right">Expired Stock Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-red-50/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-xs">
                      {item.skuCode ? (
                        <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700 font-mono">
                          {item.skuCode}
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      <div>{item.productName}</div>
                      <div className="text-[11px] font-normal text-slate-400">ID: {item.productId}</div>
                    </td>
                    <td className="py-3 px-4 text-xs font-semibold text-slate-500">{item.category}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      <span className="bg-slate-100 px-2 py-1 rounded text-xs border border-slate-200">
                        {item.batchNumber}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 font-medium">
                      {item.manufacturingDate || "—"}
                    </td>
                    <td className="py-3 px-4 text-xs font-bold text-red-700">
                      {item.ubd || item.expiryDate || "—"}
                    </td>
                    <td className="py-3 px-4">
                      <Badge className="bg-red-100 text-red-800 border border-red-300 font-semibold text-[11px]">
                        Expired {item.daysExpired > 0 ? `${item.daysExpired}d ago` : "today"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right font-black text-sm text-red-900">
                      <div>{item.expiredQtyDisplay}</div>
                      {item.pcsPerCrt > 1 && (
                        <div className="text-[11px] font-semibold text-red-600/80">
                          ({item.expiredQtyTotal.toLocaleString()} PCS)
                        </div>
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
