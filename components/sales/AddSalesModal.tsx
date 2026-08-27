"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { generateDairyBatchCode } from "@/lib/utils/batch"
import { formatMixedUnit, pcsToMixed } from "@/lib/utils"
import type { Product } from "@/components/dashboard/types"

export default function AddSalesModal({
  product,
  date,
  onSaved,
}: {
  product: Product
  date: string
  onSaved: () => void
}) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pcsPerCrt = product.pcsPerCrt || 1
  const totalAvailable = (product.opening?.total ?? 0) + (product.production?.total ?? 0) || (product.currentStockTotal ?? product.currentStock ?? 0)

  const defaultBatch = product.batchNumber && product.batchNumber !== "B1"
    ? product.batchNumber
    : generateDairyBatchCode(date, product.id)

  const [batchNumber, setBatchNumber] = useState(defaultBatch)
  const [salePc, setSalePc] = useState(
    (product.sale?.pc ?? 0) > 0
      ? String(product.sale?.pc)
      : (product.sale?.crt ?? 0) > 0 && pcsPerCrt > 1
      ? String((product.sale?.crt ?? 0) * pcsPerCrt)
      : String(product.sale?.total || "")
  )
  const [saleCrt, setSaleCrt] = useState(String(product.sale?.crt || ""))
  const [saleTotal, setSaleTotal] = useState(String(product.sale?.total || ""))

  // Helper to validate sale total against total available stock
  const validateSaleStock = (saleVal: number) => {
    if (saleVal > totalAvailable) {
      setError(`⚠️ CANNOT DISPATCH: Entered Sale Out (${saleVal} PCS) exceeds Total Available Stock (${formatMixedUnit(totalAvailable, pcsPerCrt, product.unit || "CRT", "PCS")}).`)
      return false
    } else {
      setError(null)
      return true
    }
  }

  // Smallest unit (Pcs) input handler with auto-conversion to Crt & mixed breakdown
  const handlePcsChange = (pcsVal: string) => {
    setSalePc(pcsVal)
    const pcs = parseFloat(pcsVal) || 0
    if (pcs === 0) {
      setSaleCrt("0")
      setSaleTotal("0")
      setError(null)
      return
    }

    if (pcsPerCrt > 1) {
      const mixed = pcsToMixed(pcs, pcsPerCrt, product.unit || "CRT")
      setSaleCrt(String(mixed.crt))
      setSaleTotal(String(mixed.total))
    } else {
      setSaleCrt(String(pcs))
      setSaleTotal(String(pcs))
    }

    validateSaleStock(pcs)
  }

  // Crt input handler (manual override if needed)
  const handleCrtChange = (crtVal: string) => {
    setSaleCrt(crtVal)
    const crt = parseFloat(crtVal) || 0
    if (pcsPerCrt > 1) {
      const pcsVal = Math.round(crt * pcsPerCrt)
      setSalePc(String(pcsVal))
      setSaleTotal(String(pcsVal))
      validateSaleStock(pcsVal)
    } else {
      setSalePc(String(crt))
      setSaleTotal(String(crt))
      validateSaleStock(crt)
    }
  }

  async function handleSubmit() {
    setSaving(true)
    setError(null)

    const enteredSale = Number(saleTotal) || 0

    if (enteredSale > totalAvailable) {
      setError(`⚠️ SALE VERIFICATION FAILED: Cannot dispatch ${enteredSale} ${product.unit}. Total Available Stock is only ${totalAvailable} ${product.unit}.`)
      setSaving(false)
      return
    }

    if (!batchNumber.trim()) {
      setError("Batch Number / Code is required.")
      setSaving(false)
      return
    }

    try {
      const res = await fetch("/api/metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          date,
          skuCode: product.skuCode,
          batchNumber: batchNumber.trim(),
          manufacturingDate: product.manufacturingDate,
          ubd: product.ubd,
          expiryDate: product.expiryDate,
          shelfLifeDays: product.shelfLifeDays,
          production: product.production,
          demand: product.demand,
          sale: { crt: Number(saleCrt) || 0, pc: Number(salePc) || 0, total: enteredSale },
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || "Save failed")
      setOpen(false)
      onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="h-8 px-3 text-xs font-semibold bg-gradient-to-br from-[#4A6FA5] to-[#3E5FA0] text-white border border-transparent hover:brightness-110 rounded-md transition-colors shadow-xs">
        {product.sale.total > 0 ? "Edit Sale" : "Add Sale Out"}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-white text-slate-800 border-blue-100">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-slate-800">
            Sales Out Entry: {product.name}
          </DialogTitle>
          <DialogDescription className="text-xs font-bold text-slate-600 flex items-center justify-between flex-wrap gap-2">
            <span>Date: {date} · Tally Unit: {product.unit}</span>
            {pcsPerCrt > 1 && (
              <Badge variant="outline" className="border-blue-200 bg-blue-50/60 text-[#2B4C86] font-mono text-[10px]">
                1 {product.unit} = {pcsPerCrt} Pcs
              </Badge>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-slate-800">
          {/* Available Stock Verification Banner */}
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 text-xs flex justify-between items-center">
            <span className="font-bold uppercase tracking-wider text-slate-500">Available Stock:</span>
            <div className="text-right">
              <span className="font-black text-sm text-slate-800">
                {formatMixedUnit(totalAvailable, pcsPerCrt, product.unit || "CRT", "PCS")}
              </span>
              {pcsPerCrt > 1 && (
                <div className="text-[10px] text-slate-400 font-semibold">({totalAvailable.toLocaleString()} PCS)</div>
              )}
            </div>
          </div>

          {/* Batch Code Field */}
          <div>
            <Label className="text-xs font-bold text-slate-800">Batch Number / Code</Label>
            <Input
              className="h-10 text-sm mt-1 border-blue-200 bg-white text-slate-800 font-mono font-bold"
              value={batchNumber}
              onChange={e => setBatchNumber(e.target.value)}
              placeholder="e.g. AH221003"
            />
          </div>

          {/* Smallest Unit Entry with Auto-Conversion */}
          <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-blue-100">
            <Label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
              Enter Sales Out Quantity (Smallest Unit: Pcs)
            </Label>
            
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-slate-600">Dispatch Quantity in Pieces (Pcs)</Label>
              <Input
                type="number"
                className="h-11 text-lg font-bold border border-blue-200 text-slate-800 bg-white"
                placeholder="Enter Pcs (e.g. 50)"
                value={salePc}
                onChange={e => handlePcsChange(e.target.value)}
              />
            </div>

            {/* Live Mixed Unit Result Card */}
            {pcsPerCrt > 1 && (
              <div className="bg-white p-3 rounded-lg border border-blue-200 mt-2 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Mixed Unit Breakdown:</span>
                  <span className="text-sm font-extrabold text-slate-800 font-mono bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    {formatMixedUnit(parseFloat(salePc) || 0, pcsPerCrt, product.unit || "CRT", "PCS")}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-medium">
                  {pcsPerCrt} pcs per crate · Crt: {saleCrt} · Loose Pcs: {(parseFloat(salePc) || 0) % pcsPerCrt}
                </div>
              </div>
            )}
          </div>

          {error && <p className="text-xs text-red-600 font-bold p-2.5 rounded bg-red-50 border border-red-200">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            size="lg"
            className="w-full text-base font-bold bg-gradient-to-br from-[#4A6FA5] to-[#3E5FA0] text-white border border-transparent hover:brightness-110 rounded-lg shadow-xs disabled:opacity-50"
            onClick={handleSubmit}
            disabled={saving || (Number(saleTotal) > totalAvailable)}
          >
            {saving ? "Saving..." : "Save Sales Entry"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
