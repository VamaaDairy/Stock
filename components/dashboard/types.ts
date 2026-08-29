export interface Qty {
  crt: number
  pc: number
  total: number
}

export interface BatchDetail {
  batchNumber: string
  manufacturingDate: string | null
  ubd: string | null
  expiryDate: string | null
  shelfLifeDays: number | null
  opening: Qty
  production: Qty
  demand?: Qty
  sale: Qty
  salesReturn: Qty
  closing: Qty
  closingDisplay?: string
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
  batchNumbers?: string | null
  manufacturingDate: string | null
  ubd: string | null
  expiryDate: string | null
  shelfLifeDays: number | null
  opening: Qty
  production: Qty
  demand?: Qty
  sale: Qty
  salesReturn?: Qty
  closing: Qty
  salesTarget?: number
  currentStock: number
  currentStockTotal?: number
  currentStockCrt?: number
  currentStockPc?: number
  currentStockDisplay?: string
  productionTotal?: number
  saleTotal?: number
  salesReturnTotal?: number
  batchesList?: BatchDetail[]
}

export interface CategoryGroup {
  category: string
  products: Product[]
}
