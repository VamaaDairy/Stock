const TODAY = "2026-08-24"

interface StockRow {
  productId: string
  crt: number
  pc: number
  ubd: string | null
  mfdOverride?: string
  batchSuffix?: string
}

function subtractDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00Z")
  d.setUTCDate(d.getUTCDate() - days)
  return d.toISOString().slice(0, 10)
}

async function main() {
  const { products } = await import("../lib/data/products")
  const { generateDairyBatchCode } = await import("../lib/utils/batch")
  const mod = await import("./seed-stock-2026-08-24")
  const rows: StockRow[] = (mod as any).rows

  const productMap = new Map(products.map(p => [p.id, p]))
  const seenBatchKeys = new Set<string>()

  console.log(
    "PRODUCT".padEnd(38),
    "CRT".padEnd(6),
    "PC".padEnd(5),
    "MFD".padEnd(12),
    "UBD".padEnd(12),
    "BATCH #"
  )
  console.log("-".repeat(100))

  for (const row of rows) {
    const product = productMap.get(row.productId)
    if (!product) {
      console.log(`⚠️  productId ${row.productId} NOT FOUND in catalog`)
      continue
    }
    const shelfLife = product.shelfLifeDays || 0
    const mfd = row.mfdOverride ?? subtractDays(row.ubd as string, shelfLife)
    const ubd = row.ubd ?? subtractDays(mfd, -shelfLife)
    let batchNumber = generateDairyBatchCode(mfd, product.skuCode, product.category, product.name)
    if (row.batchSuffix) batchNumber += `-${row.batchSuffix}`

    const key = `${row.productId}|${batchNumber}`
    const collision = seenBatchKeys.has(key) ? "  ⚠️ DUPLICATE BATCH#" : ""
    seenBatchKeys.add(key)

    console.log(
      product.name.padEnd(38),
      String(row.crt).padEnd(6),
      String(row.pc).padEnd(5),
      mfd.padEnd(12),
      ubd.padEnd(12),
      batchNumber + collision
    )
  }
}

main()
