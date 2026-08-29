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
import { generateDairyBatchCode, computeExpiryDate } from "@/lib/utils/batch"
import { formatMixedUnit, pcsToMixed } from "@/lib/utils"
import type { Product, BatchDetail } from "@/components/dashboard/types"

export default function AddProductionModal({
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
  /** Pass the specific batch being edited so this modal edits THAT batch, not the product aggregate. */
  editBatch?: BatchDetail
  /** Smaller trigger styling — use when placed inline in a per-batch row. */
  compact?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pcsPerCrt = product.pcsPerCrt || 1
  const unitLabel = product.unit || "CRT"

  const initialMfg =
    mode === "add" ? date : editBatch?.manufacturingDate ?? product.manufacturingDate ?? date

  // Shelf life is product-specific (set on the product master), not batch-specific —
  // always inherit it, even when adding a fresh batch, so it doesn't reset to 0.
  const initialShelfLife = String(editBatch?.shelfLifeDays ?? product.shelfLifeDays ?? 0)

  const initialExpiry =
    computeExpiryDate(initialMfg, initialShelfLife) || editBatch?.expiryDate || product.expiryDate || ""

  // In "add" mode, make sure we don't collide with an already-existing batch code
  // for this product/date so a new row gets inserted instead of overwriting one.
  const existingBatchCodes = new Set((product.batchesList || []).map(b => b.batchNumber))
  function nextFreeBatchCode(base: string) {
    if (!existingBatchCodes.has(base)) return base
    let n = 2
    while (existingBatchCodes.has(`${base}-${n}`)) n++
    return `${base}-${n}`
  }

  const defaultBatch =
    mode === "add"
      ? nextFreeBatchCode(generateDairyBatchCode(initialMfg, product.id))
      : editBatch?.batchNumber ??
        (product.batchNumber && product.batchNumber !== "B1"
          ? product.batchNumber
          : generateDairyBatchCode(initialMfg, product.id))

  const [batchNumber, setBatchNumber] = useState(defaultBatch)
  const [mfgDate, setMfgDate] = useState(initialMfg)
  const [shelfLifeDays, setShelfLifeDays] = useState(initialShelfLife)
  const [expiryDate, setExpiryDate] = useState(initialExpiry)
  const [ubd, setUbd] = useState(editBatch?.ubd ?? initialExpiry)

  // Quantities come from the specific batch being edited (if any), else the product aggregate.
  const sourceQty = mode === "edit" ? editBatch?.production ?? product.production : undefined

  const [prodPc, setProdPc] = useState(
    mode === "add"
      ? ""
      : (sourceQty?.pc ?? 0) > 0
      ? String(sourceQty?.pc)
      : (sourceQty?.crt ?? 0) > 0 && pcsPerCrt > 1
      ? String((sourceQty?.crt ?? 0) * pcsPerCrt)
      : String(sourceQty?.total || "")
  )
  const [prodCrt, setProdCrt] = useState(mode === "add" ? "" : String(sourceQty?.crt || ""))
  const [prodTotal, setProdTotal] = useState(mode === "add" ? "" : String(sourceQty?.total || ""))

  // Auto-recalculate Expiry & Batch Code whenever mfgDate or shelfLifeDays change
  const handleMfgDateChange = (newMfg: string) => {
    setMfgDate(newMfg)
    const calcExp = computeExpiryDate(newMfg, shelfLifeDays)
    if (calcExp) {
      setExpiryDate(calcExp)
      setUbd(calcExp)
    }
    if (mode === "add" || (!product.batchNumber && !editBatch) || product.batchNumber === "B1") {
      setBatchNumber(nextFreeBatchCode(generateDairyBatchCode(newMfg, product.id)))
    }
  }

  const handleShelfLifeChange = (daysStr: string) => {
    setShelfLifeDays(daysStr)
    const calcExp = computeExpiryDate(mfgDate, daysStr)
    if (calcExp) {
      setExpiryDate(calcExp)
      setUbd(calcExp)
    }
  }

  const handleExpiryDateChange = (newExp: string) => {
    setExpiryDate(newExp)
    setUbd(newExp)
    if (mfgDate && newExp) {
      const start = new Date(mfgDate).getTime()
      const end = new Date(newExp).getTime()
      const diffDays = Math.round((end - start) / (1000 * 3600 * 24))
      if (diffDays > 0) {
        setShelfLifeDays(String(diffDays))
      }
    }
  }

  // Pcs (smallest unit) input handler with auto-conversion to Crt & mixed breakdown
  const handlePcsChange = (pcsVal: string) => {
    setProdPc(pcsVal)
    const pcs = parseFloat(pcsVal) || 0
    if (pcs === 0) {
      setProdCrt("0")
      setProdTotal("0")
      return
    }

    if (pcsPerCrt > 1) {
      const mixed = pcsToMixed(pcs, pcsPerCrt, product.unit || "CRT")
      setProdCrt(String(mixed.crt))
      setProdTotal(String(mixed.total))
    } else {
      setProdCrt(String(pcs))
      setProdTotal(String(pcs))
    }
  }

  // Crt / whole-unit input handler — editable independently, auto-converts to Pcs
  const handleCrtChange = (crtVal: string) => {
    setProdCrt(crtVal)
    const crt = parseFloat(crtVal) || 0
    if (crt === 0) {
      setProdPc("0")
      setProdTotal("0")
      return
    }
    if (pcsPerCrt > 1) {
      const pcsVal = Math.round(crt * pcsPerCrt)
      setProdPc(String(pcsVal))
      setProdTotal(String(pcsVal))
    } else {
      setProdPc(String(crt))
      setProdTotal(String(crt))
    }
  }

  async function handleSubmit() {
    setSaving(true)
    setError(null)

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
          unit: product.unit || "CRT",
          manufacturingDate: mfgDate,
          ubd: ubd || expiryDate || null,
          expiryDate: expiryDate || null,
          shelfLifeDays: Number(shelfLifeDays) || 0,
          production: {
            crt: Number(prodCrt) || 0,
            pc: Number(prodPc) || 0,
            total: Number(prodTotal) || 0,
            unit: product.unit || "CRT",
          },
          sale: product.sale,
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

  // Blue gradient for the primary "Add Batch" trigger (main row), same family as Sales.
  // Compact (per-batch edit row) trigger stays the lighter white/blue-border style so it
  // doesn't visually compete with the primary Add Batch button.
  const triggerClassName = compact
    ? "h-7 px-2.5 text-[11px] font-semibold bg-white text-[#3E5FA0] border border-blue-200 hover:bg-blue-50 rounded-md transition-colors"
    : "h-8 px-3 text-xs font-semibold bg-gradient-to-br from-[#4A6FA5] to-[#3E5FA0] text-white border border-transparent hover:brightness-110 rounded-md transition-colors shadow-xs"

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={triggerClassName}>{mode === "add" ? "Add Batch" : "Edit"}</DialogTrigger>
      <DialogContent className="sm:max-w-md bg-white text-slate-800 border-blue-100">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-800">
            Production Entry: {product.name}
            {mode === "edit" && (
              <span className="block text-xs font-mono font-semibold text-slate-400 mt-0.5">
                Batch: {editBatch?.batchNumber ?? batchNumber}
              </span>
            )}
          </DialogTitle>
          <DialogDescription className="text-xs font-semibold text-slate-500 flex items-center justify-between flex-wrap gap-2">
            <span>Date: {date} · Tally Unit: {product.unit}</span>
            {pcsPerCrt > 1 && (
              <Badge variant="outline" className="border-blue-200 text-slate-600 font-mono text-[10px]">
                1 {product.unit} = {pcsPerCrt} Pcs
              </Badge>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-slate-800">
          {/* Batch Code & Mfg Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-bold text-slate-600">Batch Number / Code (Auto-generated)</Label>
              <Input
                className="h-10 text-sm mt-1 border-blue-200 bg-white text-slate-800 font-mono font-bold"
                value={batchNumber}
                onChange={e => setBatchNumber(e.target.value)}
                placeholder="e.g. AH221003"
              />
            </div>
            <div>
              <Label className="text-xs font-bold text-slate-600">Manufacturing Date</Label>
              <Input
                type="date"
                className="h-10 text-sm mt-1 border-blue-200 bg-white text-slate-800 font-semibold"
                value={mfgDate}
                onChange={e => handleMfgDateChange(e.target.value)}
              />
            </div>
          </div>

          {/* Shelf Life & Expiry */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-bold text-slate-600">Shelf Life (Days)</Label>
              <Input
                type="number"
                className="h-10 text-sm mt-1 border-blue-200 bg-white text-slate-800 font-semibold"
                value={shelfLifeDays}
                onChange={e => handleShelfLifeChange(e.target.value)}
                placeholder="e.g. 15 or 90"
              />
            </div>
            <div>
              <Label className="text-xs font-bold text-slate-600">Expiry Date (Auto-calculated)</Label>
              <Input
                type="date"
                className="h-10 text-sm mt-1 border-blue-200 bg-white text-slate-800 font-semibold"
                value={expiryDate}
                onChange={e => handleExpiryDateChange(e.target.value)}
              />
            </div>
          </div>

          {/* Output Quantity — editable CRT (or whatever the unit is) AND Pcs, both ways */}
          <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-blue-100">
            <Label className="text-xs font-bold text-neutral-800 uppercase tracking-wider block">
              Enter Output Quantity
            </Label>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-slate-500">{unitLabel} (Whole Units)</Label>
                <Input
                  type="number"
                  className="h-11 text-lg font-bold border border-blue-200 text-slate-800 bg-white"
                  placeholder={`Enter ${unitLabel}`}
                  value={prodCrt}
                  onChange={e => handleCrtChange(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-slate-500">Pcs (Smallest Unit)</Label>
                <Input
                  type="number"
                  className="h-11 text-lg font-bold border border-blue-200 text-slate-800 bg-white"
                  placeholder="Enter Pcs (e.g. 50)"
                  value={prodPc}
                  onChange={e => handlePcsChange(e.target.value)}
                />
              </div>
            </div>

            {/* Live Mixed Unit Result Card */}
            {pcsPerCrt > 1 && (
              <div className="bg-white p-3 rounded-lg border border-blue-200 mt-2 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Mixed Unit Breakdown:</span>
                  <span className="text-sm font-extrabold text-slate-800 font-mono bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    {formatMixedUnit(parseFloat(prodPc) || 0, pcsPerCrt, product.unit || "CRT", "PCS")}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-medium">
                  {pcsPerCrt} pcs per {unitLabel.toLowerCase()} · Loose Pcs: {(parseFloat(prodPc) || 0) % pcsPerCrt}
                </div>
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-600 font-semibold p-2 rounded bg-blue-50">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            size="lg"
            className="w-full text-base font-bold bg-gradient-to-br from-[#4A6FA5] to-[#3E5FA0] text-white border border-transparent hover:brightness-110 rounded-lg shadow-xs"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Production Entry"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}