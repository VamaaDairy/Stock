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

export default function AddSalesReturnModal({
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

  const defaultBatch = product.batchNumber && product.batchNumber !== "B1"
    ? product.batchNumber
    : generateDairyBatchCode(date, product.id)

  const [batchNumber, setBatchNumber] = useState(defaultBatch)
  const [returnPc, setReturnPc] = useState(
    product.salesReturn && product.salesReturn.pc > 0
      ? String(product.salesReturn.pc)
      : product.salesReturn && product.salesReturn.crt > 0 && pcsPerCrt > 1
      ? String(product.salesReturn.crt * pcsPerCrt)
      : String(product.salesReturn?.total || "")
  )
  const [returnCrt, setReturnCrt] = useState(String(product.salesReturn?.crt || ""))
  const [returnTotal, setReturnTotal] = useState(String(product.salesReturn?.total || ""))

  // Smallest unit (Pcs) input handler with auto-conversion to Crt & mixed breakdown
  const handlePcsChange = (pcsVal: string) => {
    setReturnPc(pcsVal)
    const pcs = parseFloat(pcsVal) || 0
    if (pcs === 0) {
      setReturnCrt("0")
      setReturnTotal("0")
      setError(null)
      return
    }

    if (pcsPerCrt > 1) {
      const mixed = pcsToMixed(pcs, pcsPerCrt, product.unit || "CRT")
      setReturnCrt(String(mixed.crt))
      setReturnTotal(String(mixed.total))
    } else {
      setReturnCrt(String(pcs))
      setReturnTotal(String(pcs))
    }
  }

  // Crt input handler (manual override if needed)
  const handleCrtChange = (crtVal: string) => {
    setReturnCrt(crtVal)
    const crt = parseFloat(crtVal) || 0
    if (pcsPerCrt > 1) {
      const pcsVal = Math.round(crt * pcsPerCrt)
      setReturnPc(String(pcsVal))
      setReturnTotal(String(pcsVal))
    } else {
      setReturnPc(String(crt))
      setReturnTotal(String(crt))
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
          manufacturingDate: product.manufacturingDate,
          ubd: product.ubd,
          expiryDate: product.expiryDate,
          shelfLifeDays: product.shelfLifeDays,
          production: product.production,
          demand: product.demand,
          sale: product.sale,
          salesReturn: { crt: Number(returnCrt) || 0, pc: Number(returnPc) || 0, total: Number(returnTotal) || 0 },
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
        {product.salesReturn && product.salesReturn.total > 0 ? "Edit Sales Return" : "Add Sales Return"}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-white text-slate-800 border-blue-100">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-slate-800">
            Sales Return Entry: {product.name}
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
              Enter Sales Return Quantity (Smallest Unit: Pcs)
            </Label>
            
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-slate-600">Return Quantity in Pieces (Pcs)</Label>
              <Input
                type="number"
                className="h-11 text-lg font-bold border border-blue-200 text-slate-800 bg-white"
                placeholder="Enter Pcs (e.g. 12)"
                value={returnPc}
                onChange={e => handlePcsChange(e.target.value)}
              />
            </div>

            {/* Live Mixed Unit Result Card */}
            {pcsPerCrt > 1 && (
              <div className="bg-white p-3 rounded-lg border border-blue-200 mt-2 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Mixed Unit Breakdown:</span>
                  <span className="text-sm font-extrabold text-slate-800 font-mono bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    {formatMixedUnit(parseFloat(returnPc) || 0, pcsPerCrt, product.unit || "CRT", "PCS")}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-medium">
                  {pcsPerCrt} pcs per crate · Crt: {returnCrt} · Loose Pcs: {(parseFloat(returnPc) || 0) % pcsPerCrt}
                </div>
              </div>
            )}
          </div>

          {error && <p className="text-xs text-red-600 font-bold p-2.5 rounded bg-red-50 border border-red-200">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            size="lg"
            className="w-full text-base font-bold bg-gradient-to-br from-[#4A6FA5] to-[#3E5FA0] text-white border border-transparent hover:brightness-110 rounded-lg shadow-xs"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Sales Return Entry"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
