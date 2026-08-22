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
  const [saleCrt, setSaleCrt] = useState(String(product.sale.crt || ""))
  const [salePc, setSalePc] = useState(String(product.sale.pc || ""))
  const [saleTotal, setSaleTotal] = useState(String(product.sale.total || ""))
  const [salesTarget, setSalesTarget] = useState(String(product.salesTarget || ""))

  const calcTotalFromParts = (crtStr: string, pcStr: string) => {
    const crt = parseFloat(crtStr) || 0
    const pc = parseFloat(pcStr) || 0
    if (product.unit === "PCS" || product.unit === "KG") {
      return Number((crt + pc).toFixed(4))
    }
    if (pcsPerCrt > 1) {
      return Number((crt + pc / pcsPerCrt).toFixed(4))
    }
    return Number(crt.toFixed(4))
  }

  const handleSaleCrtChange = (val: string) => {
    setSaleCrt(val)
    setSaleTotal(String(calcTotalFromParts(val, salePc)))
  }

  const handleSalePcChange = (val: string) => {
    setSalePc(val)
    setSaleTotal(String(calcTotalFromParts(saleCrt, val)))
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
      <DialogTrigger
        className={cn(
          buttonVariants({ size: "sm", variant: "outline" }),
          "text-xs font-bold bg-white text-black border border-black hover:bg-neutral-100"
        )}
      >
        {product.sale.total > 0 ? "Edit Sale" : "Add Sale Out"}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-white text-black border-black">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-black">
            Sales Out Entry: {product.name}
          </DialogTitle>
          <DialogDescription className="text-xs font-bold text-neutral-700 flex items-center justify-between flex-wrap gap-2">
            <span>Date: {date} · Unit: {product.unit}</span>
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

          {/* Daily Warehouse Dispatches */}
          <div className="space-y-1.5">
            <Label className="text-xs font-black text-black uppercase tracking-wider">
              Daily Sales Out (Actual Dispatches)
            </Label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Input className="h-11 text-base border-black text-black font-semibold" placeholder={product.unit} value={saleCrt} onChange={e => handleSaleCrtChange(e.target.value)} />
                <p className="text-[11px] font-medium text-neutral-600 text-center mt-0.5">{product.unit}</p>
              </div>
              <div>
                <Input className="h-11 text-base border-black text-black font-semibold" placeholder="Pc" value={salePc} onChange={e => handleSalePcChange(e.target.value)} />
                <p className="text-[11px] font-medium text-neutral-600 text-center mt-0.5">Pc</p>
              </div>
              <div>
                <Input className="h-11 text-base font-bold border-black text-black" placeholder="Total" value={saleTotal} onChange={e => setSaleTotal(e.target.value)} />
                <p className="text-[11px] font-medium text-neutral-600 text-center mt-0.5">Total ({product.unit})</p>
              </div>
            </div>
          </div>

          {/* Sales Target */}
          <div className="space-y-1">
            <Label className="text-xs font-bold text-black">Sales Target ({product.unit})</Label>
            <Input className="h-11 text-base border-black text-black font-semibold" value={salesTarget} onChange={e => setSalesTarget(e.target.value)} placeholder="0" />
          </div>

          <div className="bg-neutral-50 p-3 rounded-lg border border-black/20 text-xs space-y-1">
            <p className="font-bold text-black">Stock Impact Note:</p>
            <p className="text-neutral-600 font-semibold">Sales entry reduces closing stock balance directly.</p>
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
            {saving ? "Saving..." : "Save Sales Entry"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
