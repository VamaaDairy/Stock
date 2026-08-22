"use client"

import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import ProductRow from "./ProductRow"
import type { CategoryGroup } from "./types"

export default function CategorySection({
  group,
  date,
  onSaved,
}: {
  group: CategoryGroup
  date: string
  onSaved: () => void
}) {
  const entriesCount = group.products.filter(p => p.hasEntry).length
  const categoryStock = group.products.reduce((acc, p) => acc + (p.currentStock || 0), 0)
  const categoryUnit = group.products[0]?.unit || "unit"

  return (
    <AccordionItem value={group.category} className="border border-neutral-200 rounded-xl px-5 bg-white text-black shadow-xs">
      <AccordionTrigger className="text-xl font-bold hover:no-underline py-4 text-black">
        <div className="flex items-center justify-between w-full pr-4 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span className="text-black font-black">{group.category}</span>
            <Badge variant="outline" className="text-xs font-bold border-neutral-300 text-black">
              {entriesCount}/{group.products.length} entered
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Category Stock:</span>
            <span className="text-sm font-black text-black bg-neutral-100 px-2.5 py-1 rounded-md border border-neutral-300">
              {categoryStock.toLocaleString()} {categoryUnit}
            </span>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="flex flex-col">
          {group.products.map(product => (
            <ProductRow key={product.id} product={product} date={date} onSaved={onSaved} />
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}
