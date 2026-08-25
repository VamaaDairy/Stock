/**
 * Seed script: Ghee + Dahi/Paneer stock as of 24-Aug-2026
 * Source: WhatsApp stock sheets (Ghee New MRP Stock, Dahi/Paneer daily sheet)
 *
 * Run:
 *   npx tsx scripts/seed-stock-2026-08-24.ts
 *
 * Requires .env.local with TURSO_DATABASE_URL / TURSO_AUTH_TOKEN, and that
 * `products` table is already seeded (npx tsx scripts/seed.ts).
 */
import { config } from "dotenv"
config({ path: ".env.local" })

const TODAY = "2026-08-24" // stock-taking date (all entries recorded against this date)

interface StockRow {
  productId: string      // id from lib/data/products.ts
  crt: number
  pc: number
  ubd: string | null     // YYYY-MM-DD, null = not given on sheet
  mfdOverride?: string   // used only when ubd is null
  batchSuffix?: string   // disambiguates two batches that land on the same computed MFD
}

export const rows: StockRow[] = [
  // ---------------- GHEE (Image 1) ----------------
  // Ghee shelf life confirmed as 8 months (240 days) — updated in lib/data/products.ts
  // DESI GHEE — UBD given as month/year only -> assumed 1st of stated month
  { productId: "35", crt: 18, pc: 78, ubd: "2027-04-01" }, // Desi Ghee 200 ML JAR
  { productId: "36", crt: 40, pc: 0, ubd: "2027-04-01" },  // Desi Ghee 500 ML JAR
  { productId: "37", crt: 9, pc: 1, ubd: "2027-04-01" },   // batch A (regular jar)
  { productId: "37", crt: 44, pc: 0, ubd: "2027-04-01", batchSuffix: "GIFT" }, // batch B (Gift Pack)
  // SKIPPED: "GHEE 1000 ML (Gifi pack.)" box 44 — no matching product in catalog
  { productId: "38", crt: 25, pc: 1, ubd: "2027-04-01" },  // Desi Ghee 5 LTR JAR
  { productId: "39", crt: 20, pc: 17, ubd: "2027-03-01" }, // Ceka Pack 1 LTR (Desi Ghee)
  { productId: "44", crt: 92, pc: 0, ubd: "2027-04-01" },  // Ghee Tin 15 KG

  // COW GHEE
  { productId: "42", crt: 11, pc: 0, ubd: "2027-04-01" },                       // Cow Ghee Jar 1 LTR — batch A
  { productId: "42", crt: 3, pc: 0, ubd: "2027-03-01" },                        // Cow Ghee Jar 1 LTR — batch B
  { productId: "43", crt: 1, pc: 3, ubd: "2027-03-01" },                        // Cow Ghee Ceka Pack 1 LTR — batch A
  { productId: "43", crt: 20, pc: 0, ubd: "2027-03-01", batchSuffix: "B" },     // Cow Ghee Ceka Pack 1 LTR — batch B

  // ---------------- DAHI / PANEER (Image 2) ----------------
  { productId: "8", crt: 37, pc: 0, ubd: "2026-09-07" },
  { productId: "8", crt: 35, pc: 15, ubd: "2026-09-08" },
  { productId: "9", crt: 25, pc: 0, ubd: "2026-09-07" },
  { productId: "9", crt: 18, pc: 7, ubd: "2026-09-07", batchSuffix: "B" },
  { productId: "10", crt: 155, pc: 0, ubd: "2026-09-08" },
  { productId: "10", crt: 131, pc: 9, ubd: "2026-09-07" },
  { productId: "11", crt: 64, pc: 1, ubd: "2026-09-07" },
  { productId: "11", crt: 51, pc: 1, ubd: "2026-09-08" },
  { productId: "12", crt: 13, pc: 0, ubd: "2026-09-05" },
  { productId: "12", crt: 103, pc: 0, ubd: "2026-09-07" },
  { productId: "13", crt: 67, pc: 0, ubd: "2026-09-07" },
  { productId: "13", crt: 15, pc: 0, ubd: "2026-09-05" },

  { productId: "19", crt: 0, pc: 12, ubd: "2026-09-04" },
  { productId: "19", crt: 27, pc: 30, ubd: "2026-09-07" },
  { productId: "19", crt: 26, pc: 0, ubd: "2026-09-08" },
  { productId: "20", crt: 61, pc: 5, ubd: "2026-09-08" },
  { productId: "20", crt: 27, pc: 4, ubd: "2026-09-07" },
  { productId: "21", crt: 20, pc: 0, ubd: "2026-09-08" },
  { productId: "21", crt: 31, pc: 0, ubd: "2026-09-07" },
  { productId: "23", crt: 4, pc: 0, ubd: "2026-09-07" },
  { productId: "23", crt: 22, pc: 0, ubd: "2026-09-08" },

  { productId: "52", crt: 85, pc: 0, ubd: "2026-10-01" },
  { productId: "52", crt: 20, pc: 0, ubd: "2026-09-30" },

  { productId: "53", crt: 3, pc: 0, ubd: null, mfdOverride: TODAY },

  { productId: "48", crt: 71, pc: 0, ubd: "2026-09-03" },

  { productId: "29", crt: 314, pc: 0, ubd: "2026-09-08" },
  { productId: "30", crt: 42, pc: 0, ubd: "2026-09-09" },
  { productId: "31", crt: 39, pc: 0, ubd: "2026-09-09" },
]

function subtractDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00Z")
  d.setUTCDate(d.getUTCDate() - days)
  return d.toISOString().slice(0, 10)
}

async function main() {
  const { products } = await import("../lib/data/products")
  const { generateDairyBatchCode } = await import("../lib/utils/batch")
  const { upsertEntry } = await import("../lib/db/metrics")

  const productMap = new Map(products.map(p => [p.id, p]))

  let seeded = 0
  const skippedOrFlagged: string[] = []

  for (const row of rows) {
    const product = productMap.get(row.productId)
    if (!product) {
      skippedOrFlagged.push(`Product id ${row.productId} not found in catalog — skipped`)
      continue
    }

    const shelfLife = product.shelfLifeDays || 0
    const ubd = row.ubd ?? (row.mfdOverride ? subtractDays(row.mfdOverride, -shelfLife) : TODAY)
    const mfd = row.mfdOverride ?? subtractDays(row.ubd as string, shelfLife)

    let batchNumber = generateDairyBatchCode(mfd, product.id)
    if (row.batchSuffix) batchNumber += `-${row.batchSuffix}`

    const total = row.crt * (product.pcsPerCrt || 1) + row.pc

    await upsertEntry({
      productId: row.productId,
      date: TODAY,
      batchNumber,
      skuCode: product.skuCode,
      manufacturingDate: mfd,
      ubd,
      expiryDate: ubd,
      shelfLifeDays: shelfLife,
      production: { crt: row.crt, pc: row.pc, total },
      demand: { crt: 0, pc: 0, total: 0 },
      sale: { crt: 0, pc: 0, total: 0 },
      notes: "Seeded from 24-Aug-2026 stock sheet",
    })

    console.log(`✅ ${product.name} — batch ${batchNumber} — ${row.crt} ${product.unit} + ${row.pc} pc (UBD ${ubd})`)
    seeded++
  }

  console.log(`\nSeeded ${seeded} batches for ${TODAY}.`)
  if (skippedOrFlagged.length) {
    console.log("\n⚠️  Flagged (need your input):")
    skippedOrFlagged.forEach(s => console.log(" - " + s))
  }
  console.log("\n⚠️  Also skipped (not in this run, needs manual decision):")
  console.log(" - GHEE 1000 ML (Gift pack.) — 44 BOX — no matching product in lib/data/products.ts")
  console.log(" - Shrikhand 80 Gm CUP, 200 Gm cup (Plain Dahi), Plain Lassi 180 ML — all 0/0 stock, not seeded")
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
    .then(() => process.exit(0))
    .catch(err => {
      console.error("❌ Seed failed:", err)
      process.exit(1)
    })
}
