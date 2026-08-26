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
import { formatMixedUnit, pcsToMixed } from "@/lib/utils"
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

  const [demPc, setDemPc] = useState(
    (product.demand?.pc ?? 0) > 0
      ? String(product.demand?.pc)
      : (product.demand?.crt ?? 0) > 0 && pcsPerCrt > 1
      ? String((product.demand?.crt ?? 0) * pcsPerCrt)
      : String(product.demand?.total || "")
  )
  const [demCrt, setDemCrt] = useState(String(product.demand?.crt || ""))
  const [demTotal, setDemTotal] = useState(String(product.demand?.total || ""))

  // Smallest unit (Pcs) input handler with auto-conversion to Crt & mixed breakdown
  const handlePcsChange = (pcsVal: string) => {
    setDemPc(pcsVal)
    const pcs = parseFloat(pcsVal) || 0
    if (pcs === 0) {
      setDemCrt("0")
      setDemTotal("0")
      return
    }

    if (pcsPerCrt > 1) {
      const mixed = pcsToMixed(pcs, pcsPerCrt, product.unit || "CRT")
      setDemCrt(String(mixed.crt))
      setDemTotal(String(mixed.total))
    } else {
      setDemCrt(String(pcs))
      setDemTotal(String(pcs))
    }
  }

  // Crt input handler (manual override if needed)
  const handleCrtChange = (crtVal: string) => {
    setDemCrt(crtVal)
    const crt = parseFloat(crtVal) || 0
    if (pcsPerCrt > 1) {
      const pcsVal = Math.round(crt * pcsPerCrt)
      setDemPc(String(pcsVal))
      setDemTotal(String(pcsVal))
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
          batchNumber: product.batchNumber ?? "B1",
          manufacturingDate: product.manufacturingDate,
          ubd: product.ubd,
          expiryDate: product.expiryDate,
          shelfLifeDays: product.shelfLifeDays,
          production: product.production,
          demand: { crt: Number(demCrt) || 0, pc: Number(demPc) || 0, total: Number(demTotal) || 0 },
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
        {product.demand.total > 0 ? "Edit Demand" : "Add Demand"}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-white text-black border-neutral-200">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-black">
            Demand Entry: {product.name}
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
          {/* Smallest Unit Entry with Auto-Conversion */}
          <div className="space-y-2 bg-neutral-50 p-3 rounded-xl border border-neutral-200">
            <Label className="text-xs font-black text-black uppercase tracking-wider block">
              Enter Demand Quantity (Smallest Unit: Pcs)
            </Label>
            
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-neutral-700">Demand Quantity in Pieces (Pcs)</Label>
              <Input
                type="number"
                className="h-11 text-lg font-bold border border-neutral-300 text-black bg-white"
                placeholder="Enter Pcs (e.g. 50)"
                value={demPc}
                onChange={e => handlePcsChange(e.target.value)}
              />
            </div>

            {/* Live Mixed Unit Result Card */}
            {pcsPerCrt > 1 && (
              <div className="bg-white p-3 rounded-lg border border-neutral-300 mt-2 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-600">Mixed Unit Breakdown:</span>
                  <span className="text-sm font-extrabold text-black font-mono bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200">
                    {formatMixedUnit(parseFloat(demPc) || 0, pcsPerCrt, product.unit || "CRT", "PCS")}
                  </span>
                </div>
                <div className="text-[11px] text-neutral-500 font-medium">
                  {pcsPerCrt} pcs per crate · Crt: {demCrt} · Loose Pcs: {(parseFloat(demPc) || 0) % pcsPerCrt}
                </div>
              </div>
            )}
          </div>

          <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200 text-xs space-y-1">
            <p className="font-bold text-black">Live Stock Context:</p>
            <p className="text-neutral-600 font-semibold">
              Current Available Stock: <span className="font-bold text-black">{formatMixedUnit(product.currentStockTotal ?? product.currentStock, pcsPerCrt, product.unit || "CRT", "PCS")}</span>
              {pcsPerCrt > 1 && <span className="text-neutral-500 ml-1">({(product.currentStockTotal ?? product.currentStock ?? 0).toLocaleString()} PCS)</span>}
            </p>
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
            {saving ? "Saving..." : "Save Demand Entry"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
