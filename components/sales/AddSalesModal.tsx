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
import type { Product, BatchDetail } from "@/components/dashboard/types"

export default function AddSalesModal({
  product,
  date,
  onSaved,
  mode = "edit",
  editBatch,
  compact = false,
}: {
  product: Product
  date: string
  onSaved: () => void
  mode?: "add" | "edit"
  /** Pass the specific batch being edited so this modal edits THAT batch's sale-out, not the product aggregate. */
  editBatch?: BatchDetail
  /** Smaller trigger styling — use when placed inline in a per-batch row. */
  compact?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pcsPerCrt = product.pcsPerCrt || 1
  const unitLabel = product.unit || "CRT"

  // Stock available to dispatch against THIS batch = whatever was produced against it.
  // When adding a brand-new dispatch line (no batch context yet) fall back to the
  // product-level available stock, same as before.
  const batchAvailable = editBatch?.production?.total ?? 0
  const productAvailable =
    (product.opening?.total ?? 0) + (product.production?.total ?? 0) ||
    (product.currentStockTotal ?? product.currentStock ?? 0)
  const totalAvailable = mode === "edit" && editBatch ? batchAvailable : productAvailable

  // In "add" mode, don't collide with an already-existing batch code for this product/date
  // so a new dispatch line gets inserted instead of overwriting one.
  const existingBatchCodes = new Set((product.batchesList || []).map(b => b.batchNumber))
  function nextFreeBatchCode(base: string) {
    if (!existingBatchCodes.has(base)) return base
    let n = 2
    while (existingBatchCodes.has(`${base}-${n}`)) n++
    return `${base}-${n}`
  }

  const defaultBatch =
    mode === "add"
      ? nextFreeBatchCode(generateDairyBatchCode(date, product.id))
      : editBatch?.batchNumber ??
        (product.batchNumber && product.batchNumber !== "B1"
          ? product.batchNumber
          : generateDairyBatchCode(date, product.id))

  const [batchNumber, setBatchNumber] = useState(defaultBatch)

  // Quantities come from the specific batch being edited (if any), else the product aggregate.
  const sourceSale = mode === "edit" ? editBatch?.sale ?? product.sale : undefined

  const [salePc, setSalePc] = useState(
    mode === "add"
      ? ""
      : (sourceSale?.pc ?? 0) > 0
      ? String(sourceSale?.pc)
      : (sourceSale?.crt ?? 0) > 0 && pcsPerCrt > 1
      ? String((sourceSale?.crt ?? 0) * pcsPerCrt)
      : String(sourceSale?.total || "")
  )
  const [saleCrt, setSaleCrt] = useState(mode === "add" ? "" : String(sourceSale?.crt || ""))
  const [saleTotal, setSaleTotal] = useState(mode === "add" ? "" : String(sourceSale?.total || ""))

  // Helper to validate sale total against available stock (batch-scoped when editing a batch)
  const validateSaleStock = (saleVal: number) => {
    if (saleVal > totalAvailable) {
      setError(
        `⚠️ CANNOT DISPATCH: Entered Sale Out (${saleVal} PCS) exceeds Available Stock${
          mode === "edit" && editBatch ? " for this batch" : ""
        } (${formatMixedUnit(totalAvailable, pcsPerCrt, product.unit || "CRT", "PCS")}).`
      )
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
      setError(
        `⚠️ SALE VERIFICATION FAILED: Cannot dispatch ${enteredSale} ${product.unit}. Available Stock${
          mode === "edit" && editBatch ? " for this batch" : ""
        } is only ${totalAvailable} ${product.unit}.`
      )
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
          manufacturingDate: editBatch?.manufacturingDate ?? product.manufacturingDate,
          ubd: editBatch?.ubd ?? product.ubd,
          expiryDate: editBatch?.expiryDate ?? product.expiryDate,
          shelfLifeDays: editBatch?.shelfLifeDays ?? product.shelfLifeDays,
          production: editBatch?.production ?? product.production,
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

  // Blue gradient for the primary trigger (main row Add Batch / plain Add Sale Out).
  // Compact (per-batch edit row) trigger stays the lighter white/blue-border style.
  const triggerClassName = compact
    ? "h-7 px-2.5 text-[11px] font-semibold bg-white text-[#3E5FA0] border border-blue-200 hover:bg-blue-50 rounded-md transition-colors"
    : "h-8 px-3 text-xs font-semibold bg-gradient-to-br from-[#4A6FA5] to-[#3E5FA0] text-white border border-transparent hover:brightness-110 rounded-md transition-colors shadow-xs"

  const triggerLabel =
    mode === "add" ? "Add Batch" : (editBatch?.sale?.total ?? product.sale.total) > 0 ? "Edit Sale" : "Add Sale Out"

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={triggerClassName}>{triggerLabel}</DialogTrigger>
      <DialogContent className="sm:max-w-md bg-white text-slate-800 border-blue-100">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-slate-800">
            Sales Out Entry: {product.name}
            {mode === "edit" && editBatch && (
              <span className="block text-xs font-mono font-semibold text-slate-400 mt-0.5">
                Batch: {editBatch.batchNumber ?? batchNumber}
              </span>
            )}
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
            <span className="font-bold uppercase tracking-wider text-slate-500">
              Available Stock{mode === "edit" && editBatch ? " (This Batch)" : ""}:
            </span>
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
                  {pcsPerCrt} pcs per {unitLabel.toLowerCase()} · Crt: {saleCrt} · Loose Pcs: {(parseFloat(salePc) || 0) % pcsPerCrt}
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
            disabled={saving || Number(saleTotal) > totalAvailable}
          >
            {saving ? "Saving..." : "Save Sales Entry"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}