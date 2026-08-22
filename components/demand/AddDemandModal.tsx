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
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Product } from "@/components/dashboard/types"

export default function AddDemandModal({
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

  const [batchNumber, setBatchNumber] = useState(product.batchNumber ?? "B1")
  const [demPc, setDemPc] = useState(
    product.demand.pc > 0
      ? String(product.demand.pc)
      : product.demand.crt > 0 && pcsPerCrt > 1
      ? String(product.demand.crt * pcsPerCrt)
      : String(product.demand.total || "")
  )
  const [demCrt, setDemCrt] = useState(String(product.demand.crt || ""))
  const [demTotal, setDemTotal] = useState(String(product.demand.total || ""))

  // Smallest unit (Pcs) input handler with auto-conversion to Crt
  const handlePcsChange = (pcsVal: string) => {
    setDemPc(pcsVal)
    const pcs = parseFloat(pcsVal) || 0
    if (pcs === 0) {
      setDemCrt("0")
      setDemTotal("0")
      return
    }

    if (product.unit === "PCS" || product.unit === "KG") {
      setDemCrt(String(pcs))
      setDemTotal(String(pcs))
    } else if (pcsPerCrt > 1) {
      const crtVal = Number((pcs / pcsPerCrt).toFixed(4))
      setDemCrt(String(crtVal))
      setDemTotal(String(crtVal))
    } else {
      setDemCrt(String(pcs))
      setDemTotal(String(pcs))
    }
  }

  // Crt input handler (manual override if needed)
  const handleCrtChange = (crtVal: string) => {
    setDemCrt(crtVal)
    const crt = parseFloat(crtVal) || 0
    if (product.unit === "PCS" || product.unit === "KG") {
      setDemPc(String(crt))
      setDemTotal(String(crt))
    } else if (pcsPerCrt > 1) {
      const pcsVal = Math.round(crt * pcsPerCrt)
      setDemPc(String(pcsVal))
      setDemTotal(String(crt))
    } else {
      setDemPc(String(crt))
      setDemTotal(String(crt))
    }
  }

  async function handleSubmit() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          date,
          skuCode: product.skuCode,
          batchNumber,
          manufacturingDate: product.manufacturingDate,
          ubd: product.ubd,
          expiryDate: product.expiryDate,
          shelfLifeDays: product.shelfLifeDays,
          production: product.production,
          demand: { crt: Number(demCrt) || 0, pc: Number(demPc) || 0, total: Number(demTotal) || 0 },
          sale: product.sale,
          salesTarget: product.salesTarget,
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
      <DialogTrigger
        className={cn(
          buttonVariants({ size: "sm", variant: "outline" }),
          "text-xs font-bold bg-white text-black border border-black hover:bg-neutral-100"
        )}
      >
        {product.demand.total > 0 ? "Edit Demand" : "Add Demand"}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-white text-black border-black">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-black">
            Demand Entry: {product.name}
          </DialogTitle>
          <DialogDescription className="text-xs font-bold text-neutral-700 flex items-center justify-between flex-wrap gap-2">
            <span>Date: {date} · Tally Unit: {product.unit}</span>
            {pcsPerCrt > 1 && (
              <Badge variant="outline" className="border-black text-black font-mono text-[10px]">
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
              className="h-10 text-sm mt-1 border-black bg-white text-black font-mono font-bold"
              value={batchNumber}
              onChange={e => setBatchNumber(e.target.value)}
              placeholder="e.g. AA19HIM"
            />
          </div>

          {/* Smallest Unit Entry with Auto-Conversion */}
          <div className="space-y-2 bg-neutral-50 p-3 rounded-xl border border-black">
            <Label className="text-xs font-black text-black uppercase tracking-wider block">
              Enter Demand Quantity (Smallest Unit: Pcs)
            </Label>
            
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-neutral-700">Smallest Unit (Pcs)</Label>
              <Input
                type="number"
                className="h-11 text-lg font-black border-2 border-black text-black bg-white"
                placeholder="Enter Pcs (e.g. 120)"
                value={demPc}
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
                    className="h-9 text-sm font-bold border-black text-black bg-white"
                    value={demCrt}
                    onChange={e => handleCrtChange(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-[11px] font-bold text-neutral-600">Total Primary Qty ({product.unit})</Label>
                  <Input
                    type="number"
                    className="h-9 text-sm font-black border-black text-black bg-neutral-100"
                    value={demTotal}
                    readOnly
                  />
                </div>
              </div>
            )}
          </div>

          <div className="bg-neutral-50 p-3 rounded-lg border border-black/20 text-xs space-y-1">
            <p className="font-bold text-black">Live Stock Context:</p>
            <p className="text-neutral-600 font-semibold">Current Available Stock: <span className="font-bold text-black">{product.currentStock} {product.unit}</span></p>
          </div>

          {error && <p className="text-sm text-black font-bold border border-black p-2 rounded">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            size="lg"
            variant="outline"
            className="w-full text-base font-bold bg-white text-black border-2 border-black hover:bg-neutral-100"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Demand Entry"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
