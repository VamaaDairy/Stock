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
import type { Product } from "@/components/dashboard/types"

function computeExpiryDate(mfgDateStr: string, shelfLifeStr: string): string {
  if (!mfgDateStr) return ""
  const days = parseInt(shelfLifeStr, 10)
  if (isNaN(days) || days <= 0) return ""
  const d = new Date(mfgDateStr)
  if (isNaN(d.getTime())) return ""
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export default function AddProductionModal({
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

  const initialMfg = product.manufacturingDate ?? date
  const initialShelfLife = String(product.shelfLifeDays ?? 0)
  const initialExpiry = product.expiryDate ?? computeExpiryDate(initialMfg, initialShelfLife)
  const defaultBatch = product.batchNumber && product.batchNumber !== "B1"
    ? product.batchNumber
    : generateDairyBatchCode(initialMfg, product.skuCode, (product as any).category, product.name)

  const [batchNumber, setBatchNumber] = useState(defaultBatch)
  const [mfgDate, setMfgDate] = useState(initialMfg)
  const [shelfLifeDays, setShelfLifeDays] = useState(initialShelfLife)
  const [expiryDate, setExpiryDate] = useState(initialExpiry)
  const [ubd, setUbd] = useState(product.ubd ?? initialExpiry)

  const [prodPc, setProdPc] = useState(
    product.production.pc > 0
      ? String(product.production.pc)
      : product.production.crt > 0 && pcsPerCrt > 1
      ? String(product.production.crt * pcsPerCrt)
      : String(product.production.total || "")
  )
  const [prodCrt, setProdCrt] = useState(String(product.production.crt || ""))
  const [prodTotal, setProdTotal] = useState(String(product.production.total || ""))

  // Auto-recalculate Expiry & Batch Code whenever mfgDate or shelfLifeDays change
  const handleMfgDateChange = (newMfg: string) => {
    setMfgDate(newMfg)
    const calcExp = computeExpiryDate(newMfg, shelfLifeDays)
    if (calcExp) {
      setExpiryDate(calcExp)
      setUbd(calcExp)
    }
    if (!product.batchNumber || product.batchNumber === "B1") {
      setBatchNumber(generateDairyBatchCode(newMfg, product.skuCode, (product as any).category, product.name))
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

  // Smallest unit (Pcs) input handler with auto-conversion to Crt
  const handlePcsChange = (pcsVal: string) => {
    setProdPc(pcsVal)
    const pcs = parseFloat(pcsVal) || 0
    if (pcs === 0) {
      setProdCrt("0")
      setProdTotal("0")
      return
    }

    if (product.unit === "PCS" || product.unit === "KG") {
      setProdCrt(String(pcs))
      setProdTotal(String(pcs))
    } else if (pcsPerCrt > 1) {
      const crtVal = Number((pcs / pcsPerCrt).toFixed(4))
      setProdCrt(String(crtVal))
      setProdTotal(String(crtVal))
    } else {
      setProdCrt(String(pcs))
      setProdTotal(String(pcs))
    }
  }

  // Crt input handler (manual override if needed)
  const handleCrtChange = (crtVal: string) => {
    setProdCrt(crtVal)
    const crt = parseFloat(crtVal) || 0
    if (product.unit === "PCS" || product.unit === "KG") {
      setProdPc(String(crt))
      setProdTotal(String(crt))
    } else if (pcsPerCrt > 1) {
      const pcsVal = Math.round(crt * pcsPerCrt)
      setProdPc(String(pcsVal))
      setProdTotal(String(crt))
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
          manufacturingDate: mfgDate,
          ubd: ubd || expiryDate || null,
          expiryDate: expiryDate || null,
          shelfLifeDays: Number(shelfLifeDays) || 0,
          production: { crt: Number(prodCrt) || 0, pc: Number(prodPc) || 0, total: Number(prodTotal) || 0 },
          demand: product.demand,
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="h-8 px-3 text-xs font-semibold bg-white text-black border border-neutral-300 hover:bg-neutral-100 rounded-md transition-colors shadow-xs">
        {product.production.total > 0 ? "Edit Production" : "Add Production"}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-white text-black border-neutral-200">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-black">
            Production Entry: {product.name}
          </DialogTitle>
          <DialogDescription className="text-xs font-semibold text-neutral-600 flex items-center justify-between flex-wrap gap-2">
            <span>Date: {date} · Tally Unit: {product.unit}</span>
            {pcsPerCrt > 1 && (
              <Badge variant="outline" className="border-neutral-300 text-neutral-700 font-mono text-[10px]">
                1 {product.unit} = {pcsPerCrt} Pcs
              </Badge>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-black">
          {/* Batch Code & Mfg Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-bold text-neutral-700">Batch Number / Code (Auto-generated)</Label>
              <Input
                className="h-10 text-sm mt-1 border-neutral-300 bg-white text-black font-mono font-bold"
                value={batchNumber}
                onChange={e => setBatchNumber(e.target.value)}
                placeholder="e.g. AH221003"
              />
            </div>
            <div>
              <Label className="text-xs font-bold text-neutral-700">Manufacturing Date</Label>
              <Input
                type="date"
                className="h-10 text-sm mt-1 border-neutral-300 bg-white text-black font-semibold"
                value={mfgDate}
                onChange={e => handleMfgDateChange(e.target.value)}
              />
            </div>
          </div>

          {/* Shelf Life & Expiry */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-bold text-neutral-700">Shelf Life (Days)</Label>
              <Input
                type="number"
                className="h-10 text-sm mt-1 border-neutral-300 bg-white text-black font-semibold"
                value={shelfLifeDays}
                onChange={e => handleShelfLifeChange(e.target.value)}
                placeholder="e.g. 15 or 90"
              />
            </div>
            <div>
              <Label className="text-xs font-bold text-neutral-700">Expiry Date (Auto-calculated)</Label>
              <Input
                type="date"
                className="h-10 text-sm mt-1 border-neutral-300 bg-white text-black font-semibold"
                value={expiryDate}
                onChange={e => handleExpiryDateChange(e.target.value)}
              />
            </div>
          </div>

          {/* Smallest Unit Entry with Auto-Conversion */}
          <div className="space-y-2 bg-neutral-50 p-3 rounded-xl border border-neutral-200">
            <Label className="text-xs font-bold text-neutral-800 uppercase tracking-wider block">
              Enter Output Quantity (Smallest Unit: Pcs)
            </Label>
            
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-neutral-600">Smallest Unit (Pcs)</Label>
              <Input
                type="number"
                className="h-11 text-lg font-bold border border-neutral-300 text-black bg-white"
                placeholder="Enter Pcs (e.g. 120)"
                value={prodPc}
                onChange={e => handlePcsChange(e.target.value)}
              />
            </div>

            {/* Calculated Conversion Result */}
            {pcsPerCrt > 1 && (
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-neutral-200">
                <div>
                  <Label className="text-[11px] font-bold text-neutral-600">Calculated {product.unit} (Crt/Box)</Label>
                  <Input
                    type="number"
                    className="h-9 text-sm font-bold border-neutral-300 text-black bg-white"
                    value={prodCrt}
                    onChange={e => handleCrtChange(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-[11px] font-bold text-neutral-600">Total Primary Qty ({product.unit})</Label>
                  <Input
                    type="number"
                    className="h-9 text-sm font-black border-neutral-300 text-black bg-neutral-100"
                    value={prodTotal}
                    readOnly
                  />
                </div>
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-600 font-semibold p-2 rounded bg-neutral-100">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            size="lg"
            className="w-full text-base font-bold bg-white text-black border border-neutral-300 hover:bg-neutral-100 rounded-lg shadow-xs"
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
