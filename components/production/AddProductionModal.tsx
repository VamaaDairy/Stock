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

  const [batchNumber, setBatchNumber] = useState(product.batchNumber ?? "B1")
  const [mfgDate, setMfgDate] = useState(product.manufacturingDate ?? date)
  const [ubdDate, setUbdDate] = useState(product.ubd ?? "")
  const [expiryDate, setExpiryDate] = useState(product.expiryDate ?? "")
  const [shelfLifeDays, setShelfLifeDays] = useState(product.shelfLifeDays ? String(product.shelfLifeDays) : "")

  const [prodCrt, setProdCrt] = useState(String(product.production.crt || ""))
  const [prodPc, setProdPc] = useState(String(product.production.pc || ""))
  const [prodTotal, setProdTotal] = useState(String(product.production.total || ""))

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

  const handleProdCrtChange = (val: string) => {
    setProdCrt(val)
    setProdTotal(String(calcTotalFromParts(val, prodPc)))
  }

  const handleProdPcChange = (val: string) => {
    setProdPc(val)
    setProdTotal(String(calcTotalFromParts(prodCrt, val)))
  }

  const handleMfgDateChange = (newMfg: string) => {
    setMfgDate(newMfg)
    if (newMfg && shelfLifeDays) {
      const days = parseInt(shelfLifeDays, 10)
      if (!isNaN(days)) {
        const d = new Date(newMfg)
        d.setDate(d.getDate() + days)
        setExpiryDate(d.toISOString().slice(0, 10))
        if (!ubdDate) setUbdDate(d.toISOString().slice(0, 10))
      }
    }
  }

  const handleShelfLifeChange = (daysStr: string) => {
    setShelfLifeDays(daysStr)
    const days = parseInt(daysStr, 10)
    if (mfgDate && !isNaN(days)) {
      const d = new Date(mfgDate)
      d.setDate(d.getDate() + days)
      setExpiryDate(d.toISOString().slice(0, 10))
      if (!ubdDate) setUbdDate(d.toISOString().slice(0, 10))
    }
  }

  const handleExpiryDateChange = (newExp: string) => {
    setExpiryDate(newExp)
    if (mfgDate && newExp) {
      const start = new Date(mfgDate).getTime()
      const end = new Date(newExp).getTime()
      const diffDays = Math.round((end - start) / (1000 * 3600 * 24))
      if (diffDays > 0) {
        setShelfLifeDays(String(diffDays))
      }
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
          manufacturingDate: mfgDate || null,
          ubd: ubdDate || null,
          expiryDate: expiryDate || null,
          shelfLifeDays: shelfLifeDays ? Number(shelfLifeDays) : null,
          production: { crt: Number(prodCrt) || 0, pc: Number(prodPc) || 0, total: Number(prodTotal) || 0 },
          demand: product.demand,
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
        {product.production.total > 0 ? "Edit Production" : "Add Production"}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-white text-black border-black">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-black">
            Production Entry: {product.name}
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
          {/* Batch & Dates */}
          <div className="bg-neutral-50 p-3 rounded-lg border border-black/20 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold text-black">Batch Number</Label>
                <Input
                  className="h-10 text-sm mt-1 border-black bg-white text-black font-mono font-bold"
                  value={batchNumber}
                  onChange={e => setBatchNumber(e.target.value)}
                  placeholder="e.g. AA19HIM"
                />
              </div>
              <div>
                <Label className="text-xs font-bold text-black">Manufacturing Date</Label>
                <Input
                  type="date"
                  className="h-10 text-sm mt-1 border-black bg-white text-black font-semibold"
                  value={mfgDate}
                  onChange={e => handleMfgDateChange(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold text-black">Shelf Life (Days)</Label>
                <Input
                  type="number"
                  className="h-10 text-sm mt-1 border-black bg-white text-black font-semibold"
                  value={shelfLifeDays}
                  onChange={e => handleShelfLifeChange(e.target.value)}
                  placeholder="e.g. 17"
                />
              </div>
              <div>
                <Label className="text-xs font-bold text-black">Expiry Date</Label>
                <Input
                  type="date"
                  className="h-10 text-sm mt-1 border-black bg-white text-black font-semibold"
                  value={expiryDate}
                  onChange={e => handleExpiryDateChange(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Daily Production Output */}
          <div className="space-y-1.5">
            <Label className="text-xs font-black text-black uppercase tracking-wider">
              Daily Production Quantity
            </Label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Input className="h-11 text-base border-black text-black font-semibold" placeholder={product.unit} value={prodCrt} onChange={e => handleProdCrtChange(e.target.value)} />
                <p className="text-[11px] font-medium text-neutral-600 text-center mt-0.5">{product.unit}</p>
              </div>
              <div>
                <Input className="h-11 text-base border-black text-black font-semibold" placeholder="Pc" value={prodPc} onChange={e => handleProdPcChange(e.target.value)} />
                <p className="text-[11px] font-medium text-neutral-600 text-center mt-0.5">Pc</p>
              </div>
              <div>
                <Input className="h-11 text-base font-bold border-black text-black" placeholder="Total" value={prodTotal} onChange={e => setProdTotal(e.target.value)} />
                <p className="text-[11px] font-medium text-neutral-600 text-center mt-0.5">Total ({product.unit})</p>
              </div>
            </div>
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
            {saving ? "Saving..." : "Save Production Entry"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
