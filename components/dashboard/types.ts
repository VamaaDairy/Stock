export interface Qty {
  crt: number
  pc: number
  total: number
}

export interface Product {
  id: string
  name: string
  skuCode: string
  category: string
  unit: string
  pcsPerCrt: number
  hasEntry: boolean
  batchNumber: string | null
  manufacturingDate: string | null
  ubd: string | null
  expiryDate: string | null
  shelfLifeDays: number | null
  opening: Qty
  production: Qty
  demand: Qty
  sale: Qty
  closing: Qty
  salesTarget?: number
  currentStock: number
}

export interface CategoryGroup {
  category: string
  products: Product[]
}
