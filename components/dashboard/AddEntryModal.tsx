"use client"

import { useState, useEffect } from "react"
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
import type { Product } from "./types"

export default function AddEntryModal({
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

  const [skuCode, setSkuCode] = useState(product.skuCode ?? "")
  const [batchNumber, setBatchNumber] = useState(product.batchNumber ?? "B1")
  const [mfgDate, setMfgDate] = useState(product.manufacturingDate ?? date)
  const [ubdDate, setUbdDate] = useState(product.ubd ?? "")
  const [expiryDate, setExpiryDate] = useState(product.expiryDate ?? "")
  const [shelfLifeDays, setShelfLifeDays] = useState(product.shelfLifeDays ? String(product.shelfLifeDays) : "")

  const [prodCrt, setProdCrt] = useState(String(product.production.crt || ""))
  const [prodPc, setProdPc] = useState(String(product.production.pc || ""))
  const [prodTotal, setProdTotal] = useState(String(product.production.total || ""))

  const [demCrt, setDemCrt] = useState(String(product.demand.crt || ""))
  const [demPc, setDemPc] = useState(String(product.demand.pc || ""))
  const [demTotal, setDemTotal] = useState(String(product.demand.total || ""))

  const [saleCrt, setSaleCrt] = useState(String(product.sale.crt || ""))
  const [salePc, setSalePc] = useState(String(product.sale.pc || ""))
  const [saleTotal, setSaleTotal] = useState(String(product.sale.total || ""))

  const [salesTarget, setSalesTarget] = useState(String(product.salesTarget || ""))

  // Auto conversion helpers
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

  const handleDemCrtChange = (val: string) => {
    setDemCrt(val)
    setDemTotal(String(calcTotalFromParts(val, demPc)))
  }

  const handleDemPcChange = (val: string) => {
    setDemPc(val)
    setDemTotal(String(calcTotalFromParts(demCrt, val)))
  }

  const handleSaleCrtChange = (val: string) => {
    setSaleCrt(val)
    setSaleTotal(String(calcTotalFromParts(val, salePc)))
  }

  const handleSalePcChange = (val: string) => {
    setSalePc(val)
    setSaleTotal(String(calcTotalFromParts(saleCrt, val)))
  }

  // Auto-calculate Expiry / Shelf Life
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
          skuCode: skuCode.trim(),
          batchNumber,
          manufacturingDate: mfgDate || null,
          ubd: ubdDate || null,
          expiryDate: expiryDate || null,
          shelfLifeDays: shelfLifeDays ? Number(shelfLifeDays) : null,
          production: { crt: Number(prodCrt) || 0, pc: Number(prodPc) || 0, total: Number(prodTotal) || 0 },
          demand: { crt: Number(demCrt) || 0, pc: Number(demPc) || 0, total: Number(demTotal) || 0 },
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
          buttonVariants({ size: "lg", variant: "outline" }),
          "text-sm font-bold bg-white text-black border border-black hover:bg-neutral-100"
        )}
      >
        {product.hasEntry ? "Edit entry" : "Add entry"}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto bg-white text-black border-black">
        <DialogHeader>
          <DialogTitle className="text-xl font-black flex items-center justify-between text-black">
            <span>{product.name}</span>
          </DialogTitle>
          <DialogDescription className="text-sm font-bold text-neutral-700 flex items-center justify-between flex-wrap gap-2">
            <span>Date: {date} · Tally Unit: {product.unit}</span>
            {pcsPerCrt > 1 && (
              <Badge variant="outline" className="border-black text-black font-mono text-xs">
                Pack Config: 1 {product.unit} = {pcsPerCrt} Pcs
              </Badge>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-black">
          {/* SKU Code & Batch Metadata */}
          <div className="bg-neutral-50 p-3.5 rounded-lg border border-black/20 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-black">Product Code & Batch Details</h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold text-black">Product Code (SKU Code)</Label>
                <Input
                  className="h-10 text-sm mt-1 font-mono font-bold border-black bg-white text-black"
                  value={skuCode}
                  onChange={e => setSkuCode(e.target.value)}
                  placeholder="e.g. 1011"
                />
              </div>
              <div>
                <Label className="text-xs font-bold text-black">Batch Number / Code</Label>
                <Input
                  className="h-10 text-sm mt-1 border-black bg-white text-black font-semibold"
                  value={batchNumber}
                  onChange={e => setBatchNumber(e.target.value)}
                  placeholder="e.g. AI08HU"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold text-black">Manufacturing Date</Label>
                <Input
                  type="date"
                  className="h-10 text-sm mt-1 border-black bg-white text-black font-semibold"
                  value={mfgDate}
                  onChange={e => handleMfgDateChange(e.target.value)}
                />
              </div>
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
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold text-black">UBD (Use Before Date)</Label>
                <Input
                  type="date"
                  className="h-10 text-sm mt-1 border-black bg-white text-black font-semibold"
                  value={ubdDate}
                  onChange={e => setUbdDate(e.target.value)}
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

          {/* Production Section */}
          <div className="space-y-1.5">
            <Label className="text-sm font-black text-black uppercase tracking-wider">
              Daily Production
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

          {/* Demand Section */}
          <div className="space-y-1.5">
            <Label className="text-sm font-black text-black uppercase tracking-wider">
              Daily Demand (Orders Received)
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

          {/* Sale Section (Reduces Stock) */}
          <div className="space-y-1.5">
            <Label className="text-sm font-black text-black uppercase tracking-wider">
              Daily Sale (Actual Dispatches)
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
            <Label className="text-sm font-bold text-black">Sales Target ({product.unit})</Label>
            <Input className="h-11 text-base border-black text-black font-semibold" value={salesTarget} onChange={e => setSalesTarget(e.target.value)} placeholder="0" />
          </div>

          {error && <p className="text-sm text-black font-bold border border-black p-2 rounded">{error}</p>}
        </div>

        <DialogFooter className="pt-2">
          <Button
            size="lg"
            variant="outline"
            className="w-full text-base font-bold bg-white text-black border-2 border-black hover:bg-neutral-100"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Entry"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
