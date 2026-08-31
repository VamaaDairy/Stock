import { turso } from "@/lib/turso"
import { formatMixedUnit } from "@/lib/utils"

export interface ExpiredStockItem {
  id: string
  productId: string
  productName: string
  skuCode: string
  category: string
  unit: string
  packLabel: string
  pcsPerCrt: number
  batchNumber: string
  manufacturingDate: string | null
  ubd: string | null
  expiryDate: string | null
  shelfLifeDays: number
  expiredQtyCrt: number
  expiredQtyPc: number
  expiredQtyTotal: number
  expiredQtyDisplay: string
  daysExpired: number
  detectedAt: string
  notes?: string
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export async function ensureExpiredStockTable() {
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS expired_stock (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      batch_number TEXT NOT NULL,
      manufacturing_date TEXT,
      ubd TEXT,
      expiry_date TEXT,
      shelf_life_days INTEGER DEFAULT 0,
      expired_qty_total REAL NOT NULL DEFAULT 0,
      expired_qty_crt REAL NOT NULL DEFAULT 0,
      expired_qty_pc REAL NOT NULL DEFAULT 0,
      unit TEXT NOT NULL DEFAULT 'CRT',
      pcs_per_crt INTEGER NOT NULL DEFAULT 1,
      detected_at TEXT NOT NULL DEFAULT (datetime('now')),
      notes TEXT,
      UNIQUE(product_id, batch_number)
    )
  `)
  await turso.execute(`CREATE INDEX IF NOT EXISTS idx_expired_stock_product ON expired_stock(product_id)`)
  await turso.execute(`CREATE INDEX IF NOT EXISTS idx_expired_stock_batch ON expired_stock(batch_number)`)
}

/**
 * Scans all batches and identifies any with expired UBD/expiry date that still have closing stock.
 * Synchronizes with the database table `expired_stock`.
 */
export async function syncAndGetExpiredStock(): Promise<ExpiredStockItem[]> {
  await ensureExpiredStockTable()
  const today = todayStr()

  // 1. Find all batches that have reached or passed their UBD/expiry date
  const res = await turso.execute({
    sql: `
      SELECT
        b.product_id,
        b.batch_number,
        MAX(b.manufacturing_date) as manufacturing_date,
        MAX(b.ubd) as ubd,
        MAX(b.expiry_date) as expiry_date,
        MAX(b.shelf_life_days) as shelf_life_days,
        p.name as product_name,
        p.sku_code,
        p.category,
        p.unit,
        COALESCE(p.pack_label, 'Crt/Box') as pack_label,
        COALESCE(p.pcs_per_crt, 1) as pcs_per_crt,
        SUM(dm.closing_crt) as closing_crt,
        SUM(dm.closing_pc) as closing_pc,
        SUM(dm.closing_total) as closing_total
      FROM batches b
      JOIN products p ON p.id = b.product_id
      JOIN daily_metrics dm ON dm.batch_id = b.id
      GROUP BY b.product_id, b.batch_number
      HAVING (
        (MAX(b.ubd) IS NOT NULL AND MAX(b.ubd) <= ?) OR
        (MAX(b.expiry_date) IS NOT NULL AND MAX(b.expiry_date) <= ?)
      ) AND SUM(dm.closing_total) > 0
      ORDER BY MAX(b.ubd) ASC, p.category, p.name
    `,
    args: [today, today],
  })

  const expiredList: ExpiredStockItem[] = []

  for (const row of res.rows) {
    const pid = String(row.product_id)
    const bNum = String(row.batch_number || "")
    const mfd = row.manufacturing_date ? String(row.manufacturing_date) : null
    const ubd = row.ubd ? String(row.ubd) : null
    const exp = row.expiry_date ? String(row.expiry_date) : null
    const shelfDays = Number(row.shelf_life_days || 0)
    const unit = String(row.unit || "CRT")
    const pcsPerCrt = Number(row.pcs_per_crt || 1)
    const packLabel = String(row.pack_label || "Crt/Box")
    const totalPcs = Number(row.closing_total || 0)
    const crt = Number(row.closing_crt || 0)
    const pc = Number(row.closing_pc || 0)

    // Calculate days since expiry
    const effectiveExpiry = ubd || exp || today
    const diffTime = new Date(today).getTime() - new Date(effectiveExpiry).getTime()
    const daysExpired = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)))

    // Upsert into expired_stock table in DB
    const id = `${pid}_${bNum}`
    await turso.execute({
      sql: `
        INSERT INTO expired_stock (
          id, product_id, batch_number, manufacturing_date, ubd, expiry_date,
          shelf_life_days, expired_qty_total, expired_qty_crt, expired_qty_pc,
          unit, pcs_per_crt, detected_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        ON CONFLICT(product_id, batch_number) DO UPDATE SET
          expired_qty_total = excluded.expired_qty_total,
          expired_qty_crt = excluded.expired_qty_crt,
          expired_qty_pc = excluded.expired_qty_pc,
          ubd = excluded.ubd,
          expiry_date = excluded.expiry_date,
          manufacturing_date = excluded.manufacturing_date
      `,
      args: [id, pid, bNum, mfd, ubd, exp, shelfDays, totalPcs, crt, pc, unit, pcsPerCrt],
    })

    expiredList.push({
      id,
      productId: pid,
      productName: String(row.product_name || ""),
      skuCode: String(row.sku_code || ""),
      category: String(row.category || ""),
      unit,
      packLabel,
      pcsPerCrt,
      batchNumber: bNum,
      manufacturingDate: mfd,
      ubd,
      expiryDate: exp,
      shelfLifeDays: shelfDays,
      expiredQtyCrt: crt,
      expiredQtyPc: pc,
      expiredQtyTotal: totalPcs,
      expiredQtyDisplay: formatMixedUnit(totalPcs, pcsPerCrt, unit, pcsPerCrt > 1 ? "PCS" : unit),
      daysExpired,
      detectedAt: new Date().toISOString(),
    })
  }

  // Also query DB for any historical expired records that may have been recorded
  const allStored = await turso.execute(`
    SELECT
      es.*,
      p.name as product_name,
      p.sku_code,
      p.category,
      p.pack_label
    FROM expired_stock es
    JOIN products p ON p.id = es.product_id
    WHERE es.expired_qty_total > 0
    ORDER BY es.ubd ASC, p.category, p.name
  `)

  const resultMap = new Map<string, ExpiredStockItem>()
  for (const item of expiredList) {
    resultMap.set(item.id, item)
  }

  for (const row of allStored.rows) {
    const id = String(row.id)
    if (!resultMap.has(id)) {
      const ubd = row.ubd ? String(row.ubd) : null
      const exp = row.expiry_date ? String(row.expiry_date) : null
      const effectiveExpiry = ubd || exp || today
      const diffTime = new Date(today).getTime() - new Date(effectiveExpiry).getTime()
      const daysExpired = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)))
      const totalPcs = Number(row.expired_qty_total || 0)
      const pcsPerCrt = Number(row.pcs_per_crt || 1)
      const unit = String(row.unit || "CRT")

      resultMap.set(id, {
        id,
        productId: String(row.product_id),
        productName: String(row.product_name || ""),
        skuCode: String(row.sku_code || ""),
        category: String(row.category || ""),
        unit,
        packLabel: String(row.pack_label || "Crt/Box"),
        pcsPerCrt,
        batchNumber: String(row.batch_number),
        manufacturingDate: row.manufacturing_date ? String(row.manufacturing_date) : null,
        ubd,
        expiryDate: exp,
        shelfLifeDays: Number(row.shelf_life_days || 0),
        expiredQtyCrt: Number(row.expired_qty_crt || 0),
        expiredQtyPc: Number(row.expired_qty_pc || 0),
        expiredQtyTotal: totalPcs,
        expiredQtyDisplay: formatMixedUnit(totalPcs, pcsPerCrt, unit, pcsPerCrt > 1 ? "PCS" : unit),
        daysExpired,
        detectedAt: String(row.detected_at),
        notes: row.notes ? String(row.notes) : undefined,
      })
    }
  }

  return Array.from(resultMap.values())
}
