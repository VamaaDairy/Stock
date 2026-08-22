"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Edit } from "lucide-react"
import type { DBProduct } from "@/lib/db/products"

export default function ProductFormModal({
  product,
  onSaved,
}: {
  product?: DBProduct
  onSaved: () => void
}) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!product

  const [name, setName] = useState(product?.name || "")
  const [skuCode, setSkuCode] = useState(product?.skuCode || "")
  const [category, setCategory] = useState(product?.category || "Milk")
  const [unit, setUnit] = useState(product?.unit || "CRT")
  const [pcsPerCrt, setPcsPerCrt] = useState(String(product?.pcsPerCrt || 1))
  const [shelfLifeDays, setShelfLifeDays] = useState(String(product?.shelfLifeDays || 0))

  const categories = [
    "Milk",
    "UHT Milk",
    "Dahi",
    "Flavoured Dahi",
    "Kadhi Dahi",
    "Chaas & Lassi",
    "Paneer",
    "Ghee",
    "Sweets",
    "Other",
  ]

  async function handleSubmit() {
    setSaving(true)
    setError(null)

    if (!name.trim() || !skuCode.trim() || !category.trim()) {
      setError("Product Name, SKU Code, and Category are required.")
      setSaving(false)
      return
    }

    try {
      const payload = {
        id: product?.id,
        name: name.trim(),
        skuCode: skuCode.trim(),
        category: category.trim(),
        unit: unit.trim().toUpperCase(),
        pcsPerCrt: Number(pcsPerCrt) || 1,
        shelfLifeDays: Number(shelfLifeDays) || 0,
      }

      const method = isEditing ? "PUT" : "POST"
      const res = await fetch("/api/products", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const json = await res.json()
      if (!json.success) throw new Error(json.error || "Failed to save product")

      setOpen(false)
      if (!isEditing) {
        setName("")
        setSkuCode("")
      }
      onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error saving product")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={
          isEditing
            ? "h-8 text-xs font-semibold bg-black text-white hover:bg-neutral-800 border-none px-3 rounded-md flex items-center gap-1 transition-colors shadow-xs"
            : "h-10 px-4 font-bold bg-black text-white hover:bg-neutral-800 border-none rounded-md flex items-center gap-2 transition-colors shadow-xs"
        }
      >
        {isEditing ? (
          <>
            <Edit className="h-3.5 w-3.5" /> Edit
          </>
        ) : (
          <>
            <Plus className="h-4 w-4" /> Add Product
          </>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md bg-white text-black border-neutral-200">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-black">
            {isEditing ? `Edit Product: ${product?.name}` : "Add New Product"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2 text-black">
          {/* Product Name */}
          <div>
            <Label className="text-xs font-bold text-black">Product Name *</Label>
            <Input
              className="h-10 text-sm mt-1 border-neutral-300 bg-white text-black font-semibold"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Gaia Toned Milk 500 ml"
            />
          </div>

          {/* SKU Code & Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-bold text-black">SKU Code *</Label>
              <Input
                className="h-10 text-sm mt-1 border-neutral-300 bg-white text-black font-mono font-bold"
                value={skuCode}
                onChange={e => setSkuCode(e.target.value)}
                placeholder="e.g. 1003"
              />
            </div>

            <div>
              <Label className="text-xs font-bold text-black">Category *</Label>
              <select
                className="h-10 text-sm mt-1 w-full border border-neutral-300 rounded-md px-3 bg-white text-black font-semibold"
                value={category}
                onChange={e => setCategory(e.target.value)}
              >
                {categories.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Unit & Pack Size Factor */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-bold text-black">Tally Unit *</Label>
              <select
                className="h-10 text-sm mt-1 w-full border border-neutral-300 rounded-md px-3 bg-white text-black font-bold"
                value={unit}
                onChange={e => {
                  setUnit(e.target.value)
                  if (e.target.value === "PCS" || e.target.value === "KG") {
                    setPcsPerCrt("1")
                  }
                }}
              >
                <option value="CRT">CRT (Crates)</option>
                <option value="CBX">CBX (Boxes)</option>
                <option value="PCS">PCS (Pieces)</option>
                <option value="KG">KG (Kilograms)</option>
              </select>
            </div>

            <div>
              <Label className="text-xs font-bold text-black">Pcs per Crt/Box *</Label>
              <Input
                type="number"
                className="h-10 text-sm mt-1 border-neutral-300 bg-white text-black font-bold"
                value={pcsPerCrt}
                onChange={e => setPcsPerCrt(e.target.value)}
                placeholder="e.g. 60 or 1"
              />
            </div>
          </div>

          {/* Default Shelf Life */}
          <div>
            <Label className="text-xs font-bold text-black">Default Shelf Life (Days)</Label>
            <Input
              type="number"
              className="h-10 text-sm mt-1 border-neutral-300 bg-white text-black font-semibold"
              value={shelfLifeDays}
              onChange={e => setShelfLifeDays(e.target.value)}
              placeholder="e.g. 15 or 90"
            />
          </div>

          {error && <p className="text-sm text-black font-bold border border-black p-2 rounded">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            size="lg"
            className="w-full text-base font-bold bg-black text-white hover:bg-neutral-800 border-none rounded-lg shadow-xs"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? "Saving..." : isEditing ? "Update Product" : "Create Product"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
