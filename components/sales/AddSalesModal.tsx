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

  const [batchNumber, setBatchNumber] = useState(product.batchNumber ?? "B1")
  const [salePc, setSalePc] = useState(
    product.sale.pc > 0
      ? String(product.sale.pc)
      : product.sale.crt > 0 && pcsPerCrt > 1
      ? String(product.sale.crt * pcsPerCrt)
      : String(product.sale.total || "")
  )
  const [saleCrt, setSaleCrt] = useState(String(product.sale.crt || ""))
  const [saleTotal, setSaleTotal] = useState(String(product.sale.total || ""))
  const [salesTarget, setSalesTarget] = useState(String(product.salesTarget || ""))

  // Smallest unit (Pcs) input handler with auto-conversion to Crt
  const handlePcsChange = (pcsVal: string) => {
    setSalePc(pcsVal)
    const pcs = parseFloat(pcsVal) || 0
    if (pcs === 0) {
      setSaleCrt("0")
      setSaleTotal("0")
      return
    }

    if (product.unit === "PCS" || product.unit === "KG") {
      setSaleCrt(String(pcs))
      setSaleTotal(String(pcs))
    } else if (pcsPerCrt > 1) {
      const crtVal = Number((pcs / pcsPerCrt).toFixed(4))
      setSaleCrt(String(crtVal))
      setSaleTotal(String(crtVal))
    } else {
      setSaleCrt(String(pcs))
      setSaleTotal(String(pcs))
    }
  }

  // Crt input handler (manual override if needed)
  const handleCrtChange = (crtVal: string) => {
    setSaleCrt(crtVal)
    const crt = parseFloat(crtVal) || 0
    if (product.unit === "PCS" || product.unit === "KG") {
      setSalePc(String(crt))
      setSaleTotal(String(crt))
    } else if (pcsPerCrt > 1) {
      const pcsVal = Math.round(crt * pcsPerCrt)
      setSalePc(String(pcsVal))
      setSaleTotal(String(crt))
    } else {
      setSalePc(String(crt))
      setSaleTotal(String(crt))
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
          demand: product.demand,
          sale: { crt: Number(saleCrt) || 0, pc: Number(salePc) || 0, total: Number(saleTotal) || 0 },
          salesTarget: Number(salesTarget) || 0,
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
        {product.sale.total > 0 ? "Edit Sale" : "Add Sale Out"}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-white text-black border-neutral-200">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-black">
            Sales Out Entry: {product.name}
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
              placeholder="e.g. AA19HIM"
            />
          </div>

          {/* Smallest Unit Entry with Auto-Conversion */}
          <div className="space-y-2 bg-neutral-50 p-3 rounded-xl border border-neutral-200">
            <Label className="text-xs font-black text-black uppercase tracking-wider block">
              Enter Sales Out Quantity (Smallest Unit: Pcs)
            </Label>
            
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-neutral-700">Smallest Unit (Pcs)</Label>
              <Input
                type="number"
                className="h-11 text-lg font-bold border border-neutral-300 text-black bg-white"
                placeholder="Enter Pcs (e.g. 120)"
                value={salePc}
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
                    value={saleCrt}
                    onChange={e => handleCrtChange(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-[11px] font-bold text-neutral-600">Total Primary Qty ({product.unit})</Label>
                  <Input
                    type="number"
                    className="h-9 text-sm font-black border-neutral-300 text-black bg-neutral-100"
                    value={saleTotal}
                    readOnly
                  />
                </div>
              </div>
            )}
          </div>

          {/* Sales Target */}
          <div className="space-y-1">
            <Label className="text-xs font-bold text-black">Sales Target ({product.unit})</Label>
            <Input className="h-11 text-base border-neutral-300 text-black font-semibold" value={salesTarget} onChange={e => setSalesTarget(e.target.value)} placeholder="0" />
          </div>

          <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200 text-xs space-y-1">
            <p className="font-bold text-black">Stock Impact Note:</p>
            <p className="text-neutral-600 font-semibold">Sales entry reduces closing stock balance directly.</p>
          </div>

          {error && <p className="text-sm text-red-600 font-semibold p-2 rounded bg-red-50">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            size="lg"
            className="w-full text-base font-bold bg-white text-black border border-neutral-300 hover:bg-neutral-100 rounded-lg shadow-xs"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Sales Entry"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
