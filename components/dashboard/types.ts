export interface Qty {
  crt: number
  pc: number
  total: number
  unit?: string
  crtUnit?: string
  pcUnit?: string
  display?: string
}

export interface BatchDetail {
  batchNumber: string
  manufacturingDate: string | null
  ubd: string | null
  expiryDate: string | null
  shelfLifeDays: number | null
  unit?: string
  packLabel?: string
  opening: Qty
  production: Qty
  demand?: Qty
  sale: Qty
  salesReturn: Qty
  closing: Qty
  closingDisplay?: string
  isExpired?: boolean
}

export interface Product {
  id: string
  name: string
  skuCode: string
  category: string
  unit: string
  packLabel?: string
  pcsPerCrt: number
  shelfLifeDays: number | null
  hasEntry: boolean
  batchNumber: string | null
  batchNumbers?: string | null
  manufacturingDate: string | null
  ubd: string | null
  expiryDate: string | null
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
  productionCrt?: number
  productionPc?: number
  saleTotal?: number
  saleCrt?: number
  salePc?: number
  salesReturnTotal?: number
  demandTotal?: number
  expiredTotal?: number
  batchesList?: BatchDetail[]
}

export interface CategoryGroup {
  category: string
  products: Product[]
}
