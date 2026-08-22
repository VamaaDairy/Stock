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
  const [demCrt, setDemCrt] = useState(String(product.demand.crt || ""))
  const [demPc, setDemPc] = useState(String(product.demand.pc || ""))
  const [demTotal, setDemTotal] = useState(String(product.demand.total || ""))

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

  const handleDemCrtChange = (val: string) => {
    setDemCrt(val)
    setDemTotal(String(calcTotalFromParts(val, demPc)))
  }

  const handleDemPcChange = (val: string) => {
    setDemPc(val)
    setDemTotal(String(calcTotalFromParts(demCrt, val)))
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

          {/* Daily Customer Demand */}
          <div className="space-y-1.5">
            <Label className="text-xs font-black text-black uppercase tracking-wider">
              Daily Order Demand Quantity
            </Label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Input className="h-11 text-base border-black text-black font-semibold" placeholder={product.unit} value={demCrt} onChange={e => handleDemCrtChange(e.target.value)} />
                <p className="text-[11px] font-medium text-neutral-600 text-center mt-0.5">{product.unit}</p>
              </div>
              <div>
                <Input className="h-11 text-base border-black text-black font-semibold" placeholder="Pc" value={demPc} onChange={e => handleDemPcChange(e.target.value)} />
                <p className="text-[11px] font-medium text-neutral-600 text-center mt-0.5">Pc</p>
              </div>
              <div>
                <Input className="h-11 text-base font-bold border-black text-black" placeholder="Total" value={demTotal} onChange={e => setDemTotal(e.target.value)} />
                <p className="text-[11px] font-medium text-neutral-600 text-center mt-0.5">Total ({product.unit})</p>
              </div>
            </div>
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
