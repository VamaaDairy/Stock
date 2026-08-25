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

  // Smallest unit (Pcs) input handler with auto-conversion to Crt
  const handlePcsChange = (pcsVal: string) => {
    setReturnPc(pcsVal)
    const pcs = parseFloat(pcsVal) || 0
    if (pcs === 0) {
      setReturnCrt("0")
      setReturnTotal("0")
      setError(null)
      return
    }

    if (product.unit === "PCS" || product.unit === "KG") {
      setReturnCrt(String(pcs))
      setReturnTotal(String(pcs))
    } else if (pcsPerCrt > 1) {
      const crtVal = Number((pcs / pcsPerCrt).toFixed(4))
      setReturnCrt(String(crtVal))
      setReturnTotal(String(crtVal))
    } else {
      setReturnCrt(String(pcs))
      setReturnTotal(String(pcs))
    }
  }

  // Crt input handler (manual override if needed)
  const handleCrtChange = (crtVal: string) => {
    setReturnCrt(crtVal)
    const crt = parseFloat(crtVal) || 0
    if (product.unit === "PCS" || product.unit === "KG") {
      setReturnPc(String(crt))
      setReturnTotal(String(crt))
    } else if (pcsPerCrt > 1) {
      const pcsVal = Math.round(crt * pcsPerCrt)
      setReturnPc(String(pcsVal))
      setReturnTotal(String(crt))
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
      <DialogTrigger className="h-8 px-3 text-xs font-semibold bg-white text-black border border-neutral-300 hover:bg-neutral-100 rounded-md transition-colors shadow-xs">
        {product.salesReturn && product.salesReturn.total > 0 ? "Edit Sales Return" : "Add Sales Return"}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-white text-black border-neutral-200">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-black">
            Sales Return Entry: {product.name}
          </DialogTitle>
          <DialogDescription className="text-xs font-bold text-neutral-700 flex items-center justify-between flex-wrap gap-2">
            <span>Date: {date} · Tally Unit: {product.unit}</span>
            {pcsPerCrt > 1 && (
              <Badge variant="outline" className="border-neutral-300 text-black font-mono text-[10px]">
                1 {product.unit} = {pcsPerCrt} Pcs
              </Badge>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-black">
          {/* Batch Code Field */}
          <div>
            <Label className="text-xs font-bold text-black">Batch Number / Code</Label>
            <Input
              className="h-10 text-sm mt-1 border-neutral-300 bg-white text-black font-mono font-bold"
              value={batchNumber}
              onChange={e => setBatchNumber(e.target.value)}
              placeholder="e.g. AH221003"
            />
          </div>

          {/* Smallest Unit Entry with Auto-Conversion */}
          <div className="space-y-2 bg-neutral-50 p-3 rounded-xl border border-neutral-200">
            <Label className="text-xs font-black text-black uppercase tracking-wider block">
              Enter Sales Return Quantity (Smallest Unit: Pcs)
            </Label>
            
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-neutral-700">Smallest Unit (Pcs)</Label>
              <Input
                type="number"
                className="h-11 text-lg font-bold border border-neutral-300 text-black bg-white"
                placeholder="Enter Pcs (e.g. 12)"
                value={returnPc}
                onChange={e => handlePcsChange(e.target.value)}
              />
            </div>

            {/* Calculated Conversion Result */}
            {pcsPerCrt > 1 && (
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-neutral-300">
                <div>
                  <Label className="text-[11px] font-bold text-neutral-600">Calculated {product.unit} (Crt/Box)</Label>
                  <Input
                    type="number"
                    className="h-9 text-sm font-bold border-neutral-300 text-black bg-white"
                    value={returnCrt}
                    onChange={e => handleCrtChange(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-[11px] font-bold text-neutral-600">Total Primary Qty ({product.unit})</Label>
                  <Input
                    type="number"
                    className="h-9 text-sm font-black border-neutral-300 text-black bg-neutral-100"
                    value={returnTotal}
                    readOnly
                  />
                </div>
              </div>
            )}
          </div>

          {error && <p className="text-xs text-red-600 font-bold p-2.5 rounded bg-red-50 border border-red-200">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            size="lg"
            className="w-full text-base font-bold bg-white text-black border border-neutral-300 hover:bg-neutral-100 rounded-lg shadow-xs"
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
