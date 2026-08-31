"use client"

import React, { useState } from "react"
import { FileSpreadsheet, Download, Calendar, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { exportToExcel } from "@/lib/excel-export"
import { formatMixedUnit, calcUBDPercent } from "@/lib/utils"
import type { CategoryGroup } from "@/components/dashboard/types"
import type { DBProduct } from "@/lib/db/products"

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export type ExportPageType = "dashboard" | "production" | "sales" | "sales-return" | "products"

interface ExportExcelModalProps {
  pageType: ExportPageType
  currentDate?: string
  currentFromDate?: string
  currentToDate?: string
  // Optional preloaded data if already on page
  preloadedData?: CategoryGroup[]
  productsData?: DBProduct[]
  buttonVariant?: "default" | "outline" | "secondary"
  buttonClassName?: string
}

export default function ExportExcelModal({
  pageType,
  currentDate = todayStr(),
  currentFromDate = todayStr(),
  currentToDate = todayStr(),
  preloadedData,
  productsData,
  buttonVariant = "outline",
  buttonClassName = "",
}: ExportExcelModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [dateMode, setDateMode] = useState<"current" | "custom" | "all">("current")
  const [fromDate, setFromDate] = useState(currentFromDate || currentDate)
  const [toDate, setToDate] = useState(currentToDate || currentDate)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const titles: Record<ExportPageType, string> = {
    dashboard: "Current Stock & Inventory",
    production: "Production Records",
    sales: "Sales Out Records",
    "sales-return": "Sales Return Records",
    products: "Master Products Catalog",
  }

  const handleExport = async () => {
    setLoading(true)
    setError("")

    try {
      if (pageType === "products") {
        // Export Products Master
        let list: DBProduct[] = productsData || []
        if (list.length === 0) {
          const res = await fetch("/api/products")
          const json = await res.json()
          if (json.success) list = json.data
        }

        const headers = [
          "Product ID",
          "SKU Code",
          "Product Name",
          "Category",
          "Unit",
          "Pack Label",
          "Pcs Per Crate",
          "Shelf Life (Days)",
        ]

        const rows = list.map((p) => [
          p.id,
          p.skuCode || "",
          p.name,
          p.category,
          p.unit,
          p.packLabel,
          p.pcsPerCrt || 1,
          p.shelfLifeDays || "",
        ])

        exportToExcel({
          filename: `Gaia_Products_Master_${todayStr()}`,
          sheetTitle: "Master Products Catalog",
          headers,
          rows,
        })
        setIsOpen(false)
        return
      }

      // Handle Dashboard, Production, Sales, Sales-Return
      let groups: CategoryGroup[] = []
      let periodLabel = ""

      if (pageType === "dashboard" && dateMode === "all") {
        // Fetch live current stock
        const res = await fetch("/api/stock/current")
        const json = await res.json()
        if (json.success) groups = json.data
        periodLabel = "All-Time Current Stock"
      } else {
        const queryFrom = dateMode === "custom" ? fromDate : currentFromDate || currentDate
        const queryTo = dateMode === "custom" ? toDate : currentToDate || currentDate
        periodLabel = queryFrom === queryTo ? queryFrom : `${queryFrom} to ${queryTo}`

        if (dateMode === "current" && preloadedData && preloadedData.length > 0) {
          groups = preloadedData
        } else {
          const url =
            queryFrom === queryTo
              ? `/api/dashboard?date=${queryFrom}`
              : `/api/dashboard?fromDate=${queryFrom}&toDate=${queryTo}`
          const res = await fetch(url)
          const json = await res.json()
          if (json.success) groups = json.data
        }
      }

      if (!groups || groups.length === 0) {
        setError("No records found for the selected period.")
        setLoading(false)
        return
      }

      // Build Headers and Rows based on page type
      let headers: string[] = []
      const rows: (string | number | null | undefined)[][] = []

      if (pageType === "dashboard") {
        headers = [
          "Category",
          "Product ID",
          "SKU Code",
          "Product Name",
          "Batch No",
          "MFD",
          "UBD",
          "UBD %",
          "Unit",
          "Pcs/Crt",
          "Opening (Mixed)",
          "Opening (PCS)",
          "Production (Mixed)",
          "Production (PCS)",
          "Demand (Mixed)",
          "Demand (PCS)",
          "Sale (Mixed)",
          "Sale (PCS)",
          "Sales Return (Mixed)",
          "Sales Return (PCS)",
          "Closing Stock (Mixed)",
          "Closing Stock (PCS)",
        ]

        for (const group of groups) {
          for (const p of group.products) {
            const pcsPerCrt = p.pcsPerCrt || 1

            if (p.batchesList && p.batchesList.length > 0) {
              for (const b of p.batchesList) {
                const ubdPct = calcUBDPercent(b.ubd, b.shelfLifeDays || p.shelfLifeDays, b.manufacturingDate)
                rows.push([
                  group.category,
                  p.id,
                  p.skuCode || "",
                  p.name,
                  b.batchNumber,
                  b.manufacturingDate || "",
                  b.ubd || "",
                  ubdPct !== null ? `${ubdPct}%` : "",
                  p.unit,
                  pcsPerCrt,
                  formatMixedUnit(b.opening?.total || 0, pcsPerCrt, p.unit),
                  b.opening?.total || 0,
                  formatMixedUnit(b.production?.total || 0, pcsPerCrt, p.unit),
                  b.production?.total || 0,
                  formatMixedUnit(b.demand?.total || 0, pcsPerCrt, p.unit),
                  b.demand?.total || 0,
                  formatMixedUnit(b.sale?.total || 0, pcsPerCrt, p.unit),
                  b.sale?.total || 0,
                  formatMixedUnit(b.salesReturn?.total || 0, pcsPerCrt, p.unit),
                  b.salesReturn?.total || 0,
                  formatMixedUnit(b.closing?.total || 0, pcsPerCrt, p.unit),
                  b.closing?.total || 0,
                ])
              }
            } else {
              const ubdPct = calcUBDPercent(p.ubd, p.shelfLifeDays, p.manufacturingDate)
              rows.push([
                group.category,
                p.id,
                p.skuCode || "",
                p.name,
                p.batchNumber || p.batchNumbers || "",
                p.manufacturingDate || "",
                p.ubd || "",
                ubdPct !== null ? `${ubdPct}%` : "",
                p.unit,
                pcsPerCrt,
                formatMixedUnit(p.opening?.total || 0, pcsPerCrt, p.unit),
                p.opening?.total || 0,
                formatMixedUnit(p.production?.total || 0, pcsPerCrt, p.unit),
                p.production?.total || 0,
                formatMixedUnit(p.demand?.total || 0, pcsPerCrt, p.unit),
                p.demand?.total || 0,
                formatMixedUnit(p.sale?.total || 0, pcsPerCrt, p.unit),
                p.sale?.total || 0,
                formatMixedUnit(p.salesReturn?.total || 0, pcsPerCrt, p.unit),
                p.salesReturn?.total || 0,
                formatMixedUnit(p.closing?.total || 0, pcsPerCrt, p.unit),
                p.closing?.total || 0,
              ])
            }
          }
        }
      } else if (pageType === "production") {
        headers = [
          "Category",
          "Product ID",
          "SKU Code",
          "Product Name",
          "Batch No",
          "MFD",
          "UBD",
          "UBD %",
          "Unit",
          "Pcs/Crt",
          "Production Qty (Mixed)",
          "Production Qty (PCS)",
          "Opening (PCS)",
          "Closing (PCS)",
        ]

        for (const group of groups) {
          for (const p of group.products) {
            const pcsPerCrt = p.pcsPerCrt || 1
            if (p.batchesList && p.batchesList.length > 0) {
              for (const b of p.batchesList) {
                if ((b.production?.total || 0) === 0 && (p.production?.total || 0) === 0) continue
                const ubdPct = calcUBDPercent(b.ubd, b.shelfLifeDays || p.shelfLifeDays, b.manufacturingDate)
                rows.push([
                  group.category,
                  p.id,
                  p.skuCode || "",
                  p.name,
                  b.batchNumber,
                  b.manufacturingDate || "",
                  b.ubd || "",
                  ubdPct !== null ? `${ubdPct}%` : "",
                  p.unit,
                  pcsPerCrt,
                  formatMixedUnit(b.production?.total || 0, pcsPerCrt, p.unit),
                  b.production?.total || 0,
                  b.opening?.total || 0,
                  b.closing?.total || 0,
                ])
              }
            } else {
              const ubdPct = calcUBDPercent(p.ubd, p.shelfLifeDays, p.manufacturingDate)
              rows.push([
                group.category,
                p.id,
                p.skuCode || "",
                p.name,
                p.batchNumber || p.batchNumbers || "",
                p.manufacturingDate || "",
                p.ubd || "",
                ubdPct !== null ? `${ubdPct}%` : "",
                p.unit,
                pcsPerCrt,
                formatMixedUnit(p.production?.total || 0, pcsPerCrt, p.unit),
                p.production?.total || 0,
                p.opening?.total || 0,
                p.closing?.total || 0,
              ])
            }
          }
        }
      } else if (pageType === "sales") {
        headers = [
          "Category",
          "Product ID",
          "SKU Code",
          "Product Name",
          "Batch No",
          "MFD",
          "UBD",
          "UBD %",
          "Unit",
          "Pcs/Crt",
          "Sales Qty (Mixed)",
          "Sales Qty (PCS)",
          "Opening (PCS)",
          "Closing (PCS)",
        ]

        for (const group of groups) {
          for (const p of group.products) {
            const pcsPerCrt = p.pcsPerCrt || 1
            if (p.batchesList && p.batchesList.length > 0) {
              for (const b of p.batchesList) {
                if ((b.sale?.total || 0) === 0 && (p.sale?.total || 0) === 0) continue
                const ubdPct = calcUBDPercent(b.ubd, b.shelfLifeDays || p.shelfLifeDays, b.manufacturingDate)
                rows.push([
                  group.category,
                  p.id,
                  p.skuCode || "",
                  p.name,
                  b.batchNumber,
                  b.manufacturingDate || "",
                  b.ubd || "",
                  ubdPct !== null ? `${ubdPct}%` : "",
                  p.unit,
                  pcsPerCrt,
                  formatMixedUnit(b.sale?.total || 0, pcsPerCrt, p.unit),
                  b.sale?.total || 0,
                  b.opening?.total || 0,
                  b.closing?.total || 0,
                ])
              }
            } else {
              const ubdPct = calcUBDPercent(p.ubd, p.shelfLifeDays, p.manufacturingDate)
              rows.push([
                group.category,
                p.id,
                p.skuCode || "",
                p.name,
                p.batchNumber || p.batchNumbers || "",
                p.manufacturingDate || "",
                p.ubd || "",
                ubdPct !== null ? `${ubdPct}%` : "",
                p.unit,
                pcsPerCrt,
                formatMixedUnit(p.sale?.total || 0, pcsPerCrt, p.unit),
                p.sale?.total || 0,
                p.opening?.total || 0,
                p.closing?.total || 0,
              ])
            }
          }
        }
      } else if (pageType === "sales-return") {
        headers = [
          "Category",
          "Product ID",
          "SKU Code",
          "Product Name",
          "Batch No",
          "MFD",
          "UBD",
          "UBD %",
          "Unit",
          "Pcs/Crt",
          "Sales Return Qty (Mixed)",
          "Sales Return Qty (PCS)",
          "Opening (PCS)",
          "Closing (PCS)",
        ]

        for (const group of groups) {
          for (const p of group.products) {
            const pcsPerCrt = p.pcsPerCrt || 1
            if (p.batchesList && p.batchesList.length > 0) {
              for (const b of p.batchesList) {
                if ((b.salesReturn?.total || 0) === 0 && (p.salesReturn?.total || 0) === 0) continue
                const ubdPct = calcUBDPercent(b.ubd, b.shelfLifeDays || p.shelfLifeDays, b.manufacturingDate)
                rows.push([
                  group.category,
                  p.id,
                  p.skuCode || "",
                  p.name,
                  b.batchNumber,
                  b.manufacturingDate || "",
                  b.ubd || "",
                  ubdPct !== null ? `${ubdPct}%` : "",
                  p.unit,
                  pcsPerCrt,
                  formatMixedUnit(b.salesReturn?.total || 0, pcsPerCrt, p.unit),
                  b.salesReturn?.total || 0,
                  b.opening?.total || 0,
                  b.closing?.total || 0,
                ])
              }
            } else {
              const ubdPct = calcUBDPercent(p.ubd, p.shelfLifeDays, p.manufacturingDate)
              rows.push([
                group.category,
                p.id,
                p.skuCode || "",
                p.name,
                p.batchNumber || p.batchNumbers || "",
                p.manufacturingDate || "",
                p.ubd || "",
                ubdPct !== null ? `${ubdPct}%` : "",
                p.unit,
                pcsPerCrt,
                formatMixedUnit(p.salesReturn?.total || 0, pcsPerCrt, p.unit),
                p.salesReturn?.total || 0,
                p.opening?.total || 0,
                p.closing?.total || 0,
              ])
            }
          }
        }
      }

      const cleanTitle = titles[pageType] || "Report"
      const fileDate = periodLabel.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_\-]/g, "")
      const filename = `Gaia_${pageType.toUpperCase()}_${fileDate}`

      exportToExcel({
        filename,
        sheetTitle: cleanTitle,
        dateRangeText: periodLabel,
        headers,
        rows,
      })

      setIsOpen(false)
    } catch (e) {
      console.error(e)
      setError("An error occurred while exporting data.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        variant={buttonVariant}
        size="sm"
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-800 border border-emerald-300 text-[11px] font-bold px-2.5 py-1 h-8 rounded-lg transition-colors shadow-2xs ${buttonClassName}`}
      >
        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>Export Excel</span>
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5 border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Export to Excel</h3>
                  <p className="text-xs text-slate-500">{titles[pageType]}</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs font-medium">
                {error}
              </div>
            )}

            {/* Date Selection Options */}
            {pageType !== "products" ? (
              <div className="space-y-4">
                <div>
                  <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">
                    Select Period for Export
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDateMode("current")}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all text-left ${
                        dateMode === "current"
                          ? "bg-emerald-50 border-emerald-400 text-emerald-800 ring-1 ring-emerald-400"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <div className="font-bold mb-0.5">Currently Selected</div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {currentFromDate === currentToDate
                          ? currentDate
                          : `${currentFromDate} to ${currentToDate}`}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDateMode("custom")}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all text-left ${
                        dateMode === "custom"
                          ? "bg-emerald-50 border-emerald-400 text-emerald-800 ring-1 ring-emerald-400"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <div className="font-bold mb-0.5">Custom Date Range</div>
                      <div className="text-[11px] text-slate-400">Pick any dates</div>
                    </button>
                  </div>

                  {pageType === "dashboard" && (
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={() => setDateMode("all")}
                        className={`w-full px-3 py-2 rounded-lg text-xs font-semibold border transition-all text-left ${
                          dateMode === "all"
                            ? "bg-emerald-50 border-emerald-400 text-emerald-800 ring-1 ring-emerald-400"
                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <div className="font-bold mb-0.5">All-Time Cumulative Stock</div>
                        <div className="text-[11px] text-slate-400">Export true current inventory</div>
                      </button>
                    </div>
                  )}
                </div>

                {/* Custom Date Range Inputs */}
                {dateMode === "custom" && (
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3 animate-in fade-in duration-100">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                          From Date
                        </Label>
                        <Input
                          type="date"
                          value={fromDate}
                          onChange={(e) => setFromDate(e.target.value)}
                          className="h-9 text-xs font-semibold bg-white border-slate-300"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                          To Date
                        </Label>
                        <Input
                          type="date"
                          value={toDate}
                          onChange={(e) => setToDate(e.target.value)}
                          className="h-9 text-xs font-semibold bg-white border-slate-300"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                This will export all master products with SKU Codes, Categories, Units, Pack Sizes, and Shelf Life Days into Excel.
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                className="flex-1 text-xs"
                onClick={() => setIsOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleExport}
                disabled={loading}
                className="flex-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Preparing...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download Excel</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
