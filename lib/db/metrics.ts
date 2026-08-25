import { turso } from "../turso"

interface Qty {
  crt: number
  pc: number
  total: number
}

interface EntryInput {
  productId: string
  date: string
  batchNumber: string
  skuCode?: string
  manufacturingDate?: string | null
  ubd?: string | null
  expiryDate?: string | null
  shelfLifeDays?: number | null
  production: Qty
  demand: Qty
  sale: Qty
  salesReturn?: Qty
  salesTarget?: number
  notes?: string
}

async function getPreviousClosing(productId: string, date: string): Promise<Qty> {
  const result = await turso.execute({
    sql: `SELECT SUM(dm.closing_crt) as closing_crt, SUM(dm.closing_pc) as closing_pc, SUM(dm.closing_total) as closing_total
          FROM daily_metrics dm
          JOIN batches b ON b.id = dm.batch_id
          WHERE b.product_id = ? AND b.date = (
            SELECT MAX(b2.date) FROM batches b2 WHERE b2.product_id = ? AND b2.date < ?
          )`,
    args: [productId, productId, date],
  })

  if (result.rows.length === 0 || result.rows[0].closing_total === null) {
    return { crt: 0, pc: 0, total: 0 }
  }

  const row = result.rows[0]
  return {
    crt: Number(row.closing_crt || 0),
    pc: Number(row.closing_pc || 0),
    total: Number(row.closing_total || 0),
  }
}

export async function upsertEntry(input: EntryInput) {
  const {
    productId,
    date,
    batchNumber,
    skuCode,
    manufacturingDate = null,
    ubd = null,
    expiryDate = null,
    shelfLifeDays = null,
    production,
    demand,
    sale,
    salesReturn = { crt: 0, pc: 0, total: 0 },
    salesTarget = 0,
    notes,
  } = input

  // If skuCode was edited/provided, update product master
  if (skuCode !== undefined) {
    await turso.execute({
      sql: `UPDATE products SET sku_code = ? WHERE id = ?`,
      args: [skuCode, productId],
    })
  }

  const opening = await getPreviousClosing(productId, date)

  let batchId: string
  const existingBatch = await turso.execute({
    sql: `SELECT id FROM batches WHERE product_id = ? AND date = ? AND batch_number = ?`,
    args: [productId, date, batchNumber],
  })

  if (existingBatch.rows.length > 0) {
    batchId = String(existingBatch.rows[0].id)
    await turso.execute({
      sql: `UPDATE batches SET
              manufacturing_date = ?, ubd = ?, expiry_date = ?, shelf_life_days = ?
            WHERE id = ?`,
      args: [manufacturingDate || null, ubd || null, expiryDate || null, shelfLifeDays ?? null, batchId],
    })
  } else {
    batchId = crypto.randomUUID()
    await turso.execute({
      sql: `INSERT INTO batches (id, product_id, date, batch_number, manufacturing_date, ubd, expiry_date, shelf_life_days)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [batchId, productId, date, batchNumber, manufacturingDate || null, ubd || null, expiryDate || null, shelfLifeDays ?? null],
    })
  }

  const existingMetrics = await turso.execute({
    sql: `SELECT id FROM daily_metrics WHERE batch_id = ?`,
    args: [batchId],
  })

  if (existingMetrics.rows.length > 0) {
    await turso.execute({
      sql: `UPDATE daily_metrics SET
              opening_crt = ?, opening_pc = ?, opening_total = ?,
              production_crt = ?, production_pc = ?, production_total = ?,
              demand_crt = ?, demand_pc = ?, demand_total = ?,
              sale_crt = ?, sale_pc = ?, sale_total = ?,
              sales_return_crt = ?, sales_return_pc = ?, sales_return_total = ?,
              sales_target = ?, notes = ?, updated_at = datetime('now')
            WHERE batch_id = ?`,
      args: [
        opening.crt, opening.pc, opening.total,
        production.crt, production.pc, production.total,
        demand.crt, demand.pc, demand.total,
        sale.crt, sale.pc, sale.total,
        salesReturn.crt, salesReturn.pc, salesReturn.total,
        salesTarget, notes ?? null, batchId,
      ],
    })
  } else {
    await turso.execute({
      sql: `INSERT INTO daily_metrics
              (id, batch_id, opening_crt, opening_pc, opening_total,
               production_crt, production_pc, production_total,
               demand_crt, demand_pc, demand_total,
               sale_crt, sale_pc, sale_total,
               sales_return_crt, sales_return_pc, sales_return_total,
               sales_target, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        crypto.randomUUID(), batchId,
        opening.crt, opening.pc, opening.total,
        production.crt, production.pc, production.total,
        demand.crt, demand.pc, demand.total,
        sale.crt, sale.pc, sale.total,
        salesReturn.crt, salesReturn.pc, salesReturn.total,
        salesTarget, notes ?? null,
      ],
    })
  }

  return { batchId }
}

export async function recordSaleEntry(input: {
  productId: string
  date: string
  batchNumber: string
  saleCrt: number
  salePc: number
  saleTotal: number
  notes?: string
}) {
  const { productId, date, batchNumber, saleCrt, salePc, saleTotal, notes } = input

  // 1. Find existing batch master to inherit metadata (ubd, mfd, shelf life)
  const masterBatch = await turso.execute({
    sql: `SELECT manufacturing_date, ubd, expiry_date, shelf_life_days
          FROM batches
          WHERE product_id = ? AND batch_number = ?
          LIMIT 1`,
    args: [productId, batchNumber],
  })

  const mfd = masterBatch.rows[0]?.manufacturing_date ? String(masterBatch.rows[0].manufacturing_date) : null
  const ubd = masterBatch.rows[0]?.ubd ? String(masterBatch.rows[0].ubd) : null
  const exp = masterBatch.rows[0]?.expiry_date ? String(masterBatch.rows[0].expiry_date) : null
  const shelfLife = masterBatch.rows[0]?.shelf_life_days !== undefined && masterBatch.rows[0]?.shelf_life_days !== null
    ? Number(masterBatch.rows[0].shelf_life_days)
    : null

  // 2. Find or create batch row on this specific sale date
  let batchId: string
  const existingBatch = await turso.execute({
    sql: `SELECT id FROM batches WHERE product_id = ? AND date = ? AND batch_number = ?`,
    args: [productId, date, batchNumber],
  })

  if (existingBatch.rows.length > 0) {
    batchId = String(existingBatch.rows[0].id)
    // Update metadata if available
    if (mfd || ubd || exp || shelfLife) {
      await turso.execute({
        sql: `UPDATE batches SET
                manufacturing_date = COALESCE(?, manufacturing_date),
                ubd = COALESCE(?, ubd),
                expiry_date = COALESCE(?, expiry_date),
                shelf_life_days = COALESCE(?, shelf_life_days)
              WHERE id = ?`,
        args: [mfd, ubd, exp, shelfLife, batchId],
      })
    }
  } else {
    batchId = crypto.randomUUID()
    await turso.execute({
      sql: `INSERT INTO batches (id, product_id, date, batch_number, manufacturing_date, ubd, expiry_date, shelf_life_days)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [batchId, productId, date, batchNumber, mfd, ubd, exp, shelfLife],
    })
  }

  // 3. Update or insert daily_metrics preserving existing production/opening
  const existingMetrics = await turso.execute({
    sql: `SELECT id, sale_crt, sale_pc, sale_total FROM daily_metrics WHERE batch_id = ?`,
    args: [batchId],
  })

  if (existingMetrics.rows.length > 0) {
    // Add to existing sale or update
    await turso.execute({
      sql: `UPDATE daily_metrics SET
              sale_crt = ?, sale_pc = ?, sale_total = ?,
              notes = COALESCE(?, notes),
              updated_at = datetime('now')
            WHERE batch_id = ?`,
      args: [saleCrt, salePc, saleTotal, notes ?? null, batchId],
    })
  } else {
    const opening = await getPreviousClosing(productId, date)
    await turso.execute({
      sql: `INSERT INTO daily_metrics
              (id, batch_id, opening_crt, opening_pc, opening_total,
               production_crt, production_pc, production_total,
               demand_crt, demand_pc, demand_total,
               sale_crt, sale_pc, sale_total,
               sales_return_crt, sales_return_pc, sales_return_total,
               sales_target, notes)
            VALUES (?, ?, ?, ?, ?, 0, 0, 0, 0, 0, 0, ?, ?, ?, 0, 0, 0, 0, ?)`,
      args: [
        crypto.randomUUID(), batchId,
        opening.crt, opening.pc, opening.total,
        saleCrt, salePc, saleTotal,
        notes ?? null,
      ],
    })
  }

  return { batchId, productId, batchNumber, date, saleTotal }
}

export async function getMetricsForDate(date: string) {
  const result = await turso.execute({
    sql: `SELECT p.id as product_id, p.name, p.sku_code, p.category, p.unit, COALESCE(p.pcs_per_crt, 1) as pcs_per_crt, COALESCE(p.shelf_life_days, 0) as product_shelf_life,
                 GROUP_CONCAT(DISTINCT b.batch_number) as batch_number,
                 MIN(b.manufacturing_date) as manufacturing_date,
                 MAX(b.ubd) as ubd,
                 MAX(b.expiry_date) as expiry_date,
                 MAX(b.shelf_life_days) as shelf_life_days,
                 SUM(dm.opening_crt) as opening_crt, SUM(dm.opening_pc) as opening_pc, SUM(dm.opening_total) as opening_total,
                 SUM(dm.production_crt) as production_crt, SUM(dm.production_pc) as production_pc, SUM(dm.production_total) as production_total,
                 SUM(dm.total_crt) as total_crt, SUM(dm.total_pc) as total_pc, SUM(dm.total_total) as total_total,
                 SUM(dm.demand_crt) as demand_crt, SUM(dm.demand_pc) as demand_pc, SUM(dm.demand_total) as demand_total,
                 SUM(dm.sale_crt) as sale_crt, SUM(dm.sale_pc) as sale_pc, SUM(dm.sale_total) as sale_total,
                 SUM(dm.sales_return_crt) as sales_return_crt, SUM(dm.sales_return_pc) as sales_return_pc, SUM(dm.sales_return_total) as sales_return_total,
                 SUM(dm.closing_crt) as closing_crt, SUM(dm.closing_pc) as closing_pc, SUM(dm.closing_total) as closing_total,
                 SUM(dm.sales_target) as sales_target
          FROM products p
          JOIN batches b ON b.product_id = p.id AND b.date = ?
          JOIN daily_metrics dm ON dm.batch_id = b.id
          GROUP BY p.id
          ORDER BY p.category, p.name`,
    args: [date],
  })
  return result.rows
}

export async function getDashboardData(date: string) {
  const productsResult = await turso.execute({
    sql: `SELECT id, name, sku_code, category, unit, COALESCE(pcs_per_crt, 1) as pcs_per_crt, COALESCE(shelf_life_days, 0) as shelf_life_days FROM products ORDER BY category, name`,
  })

  const metricsResult = await turso.execute({
    sql: `SELECT p.id as product_id,
                 GROUP_CONCAT(DISTINCT b.batch_number) as batch_number,
                 MIN(b.manufacturing_date) as manufacturing_date,
                 MAX(b.ubd) as ubd,
                 MAX(b.expiry_date) as expiry_date,
                 MAX(b.shelf_life_days) as shelf_life_days,
                 SUM(dm.opening_crt) as opening_crt, SUM(dm.opening_pc) as opening_pc, SUM(dm.opening_total) as opening_total,
                 SUM(dm.production_crt) as production_crt, SUM(dm.production_pc) as production_pc, SUM(dm.production_total) as production_total,
                 SUM(dm.total_crt) as total_crt, SUM(dm.total_pc) as total_pc, SUM(dm.total_total) as total_total,
                 SUM(dm.demand_crt) as demand_crt, SUM(dm.demand_pc) as demand_pc, SUM(dm.demand_total) as demand_total,
                 SUM(dm.sale_crt) as sale_crt, SUM(dm.sale_pc) as sale_pc, SUM(dm.sale_total) as sale_total,
                 SUM(dm.sales_return_crt) as sales_return_crt, SUM(dm.sales_return_pc) as sales_return_pc, SUM(dm.sales_return_total) as sales_return_total,
                 SUM(dm.closing_crt) as closing_crt, SUM(dm.closing_pc) as closing_pc, SUM(dm.closing_total) as closing_total,
                 SUM(dm.sales_target) as sales_target
          FROM products p
          JOIN batches b ON b.product_id = p.id AND b.date = ?
          JOIN daily_metrics dm ON dm.batch_id = b.id
          GROUP BY p.id`,
    args: [date],
  })

  // Fetch individual batch breakdowns for that date
  const batchBreakdownResult = await turso.execute({
    sql: `SELECT b.product_id, b.batch_number, b.manufacturing_date, b.ubd, b.expiry_date, b.shelf_life_days,
                 dm.opening_crt, dm.opening_pc, dm.opening_total,
                 dm.production_crt, dm.production_pc, dm.production_total,
                 dm.demand_crt, dm.demand_pc, dm.demand_total,
                 dm.sale_crt, dm.sale_pc, dm.sale_total,
                 dm.sales_return_crt, dm.sales_return_pc, dm.sales_return_total,
                 dm.closing_crt, dm.closing_pc, dm.closing_total
          FROM batches b
          JOIN daily_metrics dm ON dm.batch_id = b.id
          WHERE b.date = ?
          ORDER BY b.batch_number`,
    args: [date],
  })

  const batchesByProduct = new Map<string, any[]>()
  for (const row of batchBreakdownResult.rows) {
    const pid = String(row.product_id)
    if (!batchesByProduct.has(pid)) batchesByProduct.set(pid, [])
    batchesByProduct.get(pid)!.push({
      batchNumber: String(row.batch_number || ""),
      manufacturingDate: row.manufacturing_date ? String(row.manufacturing_date) : null,
      ubd: row.ubd ? String(row.ubd) : null,
      expiryDate: row.expiry_date ? String(row.expiry_date) : null,
      shelfLifeDays: row.shelf_life_days !== null ? Number(row.shelf_life_days) : null,
      opening: { crt: Number(row.opening_crt ?? 0), pc: Number(row.opening_pc ?? 0), total: Number(row.opening_total ?? 0) },
      production: { crt: Number(row.production_crt ?? 0), pc: Number(row.production_pc ?? 0), total: Number(row.production_total ?? 0) },
      demand: { crt: Number(row.demand_crt ?? 0), pc: Number(row.demand_pc ?? 0), total: Number(row.demand_total ?? 0) },
      sale: { crt: Number(row.sale_crt ?? 0), pc: Number(row.sale_pc ?? 0), total: Number(row.sale_total ?? 0) },
      salesReturn: { crt: Number(row.sales_return_crt ?? 0), pc: Number(row.sales_return_pc ?? 0), total: Number(row.sales_return_total ?? 0) },
      closing: { crt: Number(row.closing_crt ?? 0), pc: Number(row.closing_pc ?? 0), total: Number(row.closing_total ?? 0) },
    })
  }

  const metricsByProduct = new Map(
    metricsResult.rows.map(row => [String(row.product_id), row])
  )

  const categories = new Map<string, any[]>()

  for (const p of productsResult.rows) {
    const productId = String(p.id)
    const metrics = metricsByProduct.get(productId)
    const category = String(p.category)

    if (!categories.has(category)) categories.set(category, [])

    const closingTotal = Number(metrics?.closing_total ?? 0)

    const effectiveShelfLife = metrics?.shelf_life_days !== null && metrics?.shelf_life_days !== undefined
      ? Number(metrics.shelf_life_days)
      : (p.shelf_life_days ? Number(p.shelf_life_days) : null)

    categories.get(category)!.push({
      id: productId,
      name: p.name,
      skuCode: String(p.sku_code || ""),
      unit: p.unit,
      pcsPerCrt: Number(p.pcs_per_crt || 1),
      hasEntry: !!metrics,
      batchNumber: metrics?.batch_number ? String(metrics.batch_number) : null,
      manufacturingDate: metrics?.manufacturing_date ? String(metrics.manufacturing_date) : null,
      ubd: metrics?.ubd ? String(metrics.ubd) : null,
      expiryDate: metrics?.expiry_date ? String(metrics.expiry_date) : null,
      shelfLifeDays: effectiveShelfLife,
      opening: { crt: Number(metrics?.opening_crt ?? 0), pc: Number(metrics?.opening_pc ?? 0), total: Number(metrics?.opening_total ?? 0) },
      production: { crt: Number(metrics?.production_crt ?? 0), pc: Number(metrics?.production_pc ?? 0), total: Number(metrics?.production_total ?? 0) },
      demand: { crt: Number(metrics?.demand_crt ?? 0), pc: Number(metrics?.demand_pc ?? 0), total: Number(metrics?.demand_total ?? 0) },
      sale: { crt: Number(metrics?.sale_crt ?? 0), pc: Number(metrics?.sale_pc ?? 0), total: Number(metrics?.sale_total ?? 0) },
      salesReturn: { crt: Number(metrics?.sales_return_crt ?? 0), pc: Number(metrics?.sales_return_pc ?? 0), total: Number(metrics?.sales_return_total ?? 0) },
      closing: { crt: Number(metrics?.closing_crt ?? 0), pc: Number(metrics?.closing_pc ?? 0), total: closingTotal },
      salesTarget: Number(metrics?.sales_target ?? 0),
      currentStock: closingTotal,
      batchesList: batchesByProduct.get(productId) || [],
    })
  }

  return Array.from(categories.entries()).map(([category, products]) => ({
    category,
    products,
  }))
}

export async function getPeriodDashboardData(startDate: string, endDate: string) {
  if (startDate === endDate) {
    return getDashboardData(startDate)
  }

  const productsResult = await turso.execute({
    sql: `SELECT id, name, sku_code, category, unit, COALESCE(pcs_per_crt, 1) as pcs_per_crt, COALESCE(shelf_life_days, 0) as shelf_life_days FROM products ORDER BY category, name`,
  })

  const metricsResult = await turso.execute({
    sql: `SELECT p.id as product_id,
                 GROUP_CONCAT(DISTINCT b.batch_number) as batch_numbers,
                 MIN(b.manufacturing_date) as manufacturing_date,
                 MAX(b.ubd) as ubd,
                 MAX(b.expiry_date) as expiry_date,
                 MAX(b.shelf_life_days) as shelf_life_days,
                 SUM(dm.production_crt) as production_crt,
                 SUM(dm.production_pc) as production_pc,
                 SUM(dm.production_total) as production_total,
                 SUM(dm.demand_crt) as demand_crt,
                 SUM(dm.demand_pc) as demand_pc,
                 SUM(dm.demand_total) as demand_total,
                 SUM(dm.sale_crt) as sale_crt,
                 SUM(dm.sale_pc) as sale_pc,
                 SUM(dm.sale_total) as sale_total,
                 SUM(dm.sales_return_crt) as sales_return_crt,
                 SUM(dm.sales_return_pc) as sales_return_pc,
                 SUM(dm.sales_return_total) as sales_return_total,
                 SUM(dm.sales_target) as sales_target
          FROM products p
          JOIN batches b ON b.product_id = p.id AND b.date >= ? AND b.date <= ?
          JOIN daily_metrics dm ON dm.batch_id = b.id
          GROUP BY p.id`,
    args: [startDate, endDate],
  })

  // Fetch batch details for period
  const batchBreakdownResult = await turso.execute({
    sql: `SELECT b.product_id, b.batch_number, b.manufacturing_date, b.ubd, b.expiry_date, b.shelf_life_days,
                 SUM(dm.opening_crt) as opening_crt, SUM(dm.opening_pc) as opening_pc, SUM(dm.opening_total) as opening_total,
                 SUM(dm.production_crt) as production_crt, SUM(dm.production_pc) as production_pc, SUM(dm.production_total) as production_total,
                 SUM(dm.demand_crt) as demand_crt, SUM(dm.demand_pc) as demand_pc, SUM(dm.demand_total) as demand_total,
                 SUM(dm.sale_crt) as sale_crt, SUM(dm.sale_pc) as sale_pc, SUM(dm.sale_total) as sale_total,
                 SUM(dm.sales_return_crt) as sales_return_crt, SUM(dm.sales_return_pc) as sales_return_pc, SUM(dm.sales_return_total) as sales_return_total,
                 SUM(dm.closing_crt) as closing_crt, SUM(dm.closing_pc) as closing_pc, SUM(dm.closing_total) as closing_total
          FROM batches b
          JOIN daily_metrics dm ON dm.batch_id = b.id
          WHERE b.date >= ? AND b.date <= ?
          GROUP BY b.product_id, b.batch_number
          ORDER BY b.batch_number`,
    args: [startDate, endDate],
  })

  const batchesByProduct = new Map<string, any[]>()
  for (const row of batchBreakdownResult.rows) {
    const pid = String(row.product_id)
    if (!batchesByProduct.has(pid)) batchesByProduct.set(pid, [])
    batchesByProduct.get(pid)!.push({
      batchNumber: String(row.batch_number || ""),
      manufacturingDate: row.manufacturing_date ? String(row.manufacturing_date) : null,
      ubd: row.ubd ? String(row.ubd) : null,
      expiryDate: row.expiry_date ? String(row.expiry_date) : null,
      shelfLifeDays: row.shelf_life_days !== null ? Number(row.shelf_life_days) : null,
      opening: { crt: Number(row.opening_crt ?? 0), pc: Number(row.opening_pc ?? 0), total: Number(row.opening_total ?? 0) },
      production: { crt: Number(row.production_crt ?? 0), pc: Number(row.production_pc ?? 0), total: Number(row.production_total ?? 0) },
      demand: { crt: Number(row.demand_crt ?? 0), pc: Number(row.demand_pc ?? 0), total: Number(row.demand_total ?? 0) },
      sale: { crt: Number(row.sale_crt ?? 0), pc: Number(row.sale_pc ?? 0), total: Number(row.sale_total ?? 0) },
      salesReturn: { crt: Number(row.sales_return_crt ?? 0), pc: Number(row.sales_return_pc ?? 0), total: Number(row.sales_return_total ?? 0) },
      closing: { crt: Number(row.closing_crt ?? 0), pc: Number(row.closing_pc ?? 0), total: Number(row.closing_total ?? 0) },
    })
  }

  const metricsByProduct = new Map(
    metricsResult.rows.map(row => [String(row.product_id), row])
  )

  const categories = new Map<string, any[]>()

  for (const p of productsResult.rows) {
    const productId = String(p.id)
    const metrics = metricsByProduct.get(productId)
    const category = String(p.category)

    if (!categories.has(category)) categories.set(category, [])

    const opening = await getPreviousClosing(productId, startDate)
    const prodTotal = Number(metrics?.production_total ?? 0)
    const saleTotal = Number(metrics?.sale_total ?? 0)
    const salesReturnTotal = Number(metrics?.sales_return_total ?? 0)
    const closingTotal = opening.total + prodTotal + salesReturnTotal - saleTotal

    const effectiveShelfLife = metrics?.shelf_life_days !== null && metrics?.shelf_life_days !== undefined
      ? Number(metrics.shelf_life_days)
      : (p.shelf_life_days ? Number(p.shelf_life_days) : null)

    categories.get(category)!.push({
      id: productId,
      name: p.name,
      skuCode: String(p.sku_code || ""),
      unit: p.unit,
      pcsPerCrt: Number(p.pcs_per_crt || 1),
      hasEntry: !!metrics,
      batchNumber: metrics?.batch_numbers ? String(metrics.batch_numbers) : null,
      manufacturingDate: metrics?.manufacturing_date ? String(metrics.manufacturing_date) : null,
      ubd: metrics?.ubd ? String(metrics.ubd) : null,
      expiryDate: metrics?.expiry_date ? String(metrics.expiry_date) : null,
      shelfLifeDays: effectiveShelfLife,
      opening: opening,
      production: { crt: Number(metrics?.production_crt ?? 0), pc: Number(metrics?.production_pc ?? 0), total: prodTotal },
      demand: { crt: Number(metrics?.demand_crt ?? 0), pc: Number(metrics?.demand_pc ?? 0), total: Number(metrics?.demand_total ?? 0) },
      sale: { crt: Number(metrics?.sale_crt ?? 0), pc: Number(metrics?.sale_pc ?? 0), total: saleTotal },
      salesReturn: { crt: Number(metrics?.sales_return_crt ?? 0), pc: Number(metrics?.sales_return_pc ?? 0), total: salesReturnTotal },
      closing: { crt: 0, pc: 0, total: closingTotal },
      salesTarget: Number(metrics?.sales_target ?? 0),
      currentStock: closingTotal,
      batchesList: batchesByProduct.get(productId) || [],
    })
  }

  return Array.from(categories.entries()).map(([category, products]) => ({
    category,
    products,
  }))
}

/**
 * getCurrentStock — returns cumulative all-time closing stock (no date filter).
 * For each product+batch, sums ALL production/sales/returns ever recorded.
 * Closing = SUM(opening) + SUM(production) + SUM(sales_return) - SUM(sale)
 * Displayed in smallest units: CRT (boxes) + PC (loose pieces) + total.
 */
export async function getCurrentStock() {
  const productsResult = await turso.execute({
    sql: `SELECT id, name, sku_code, category, unit, COALESCE(pcs_per_crt, 1) as pcs_per_crt, COALESCE(shelf_life_days, 0) as shelf_life_days FROM products ORDER BY category, name`,
  })

  // All-time batch totals (no date filter)
  const batchResult = await turso.execute({
    sql: `SELECT
            b.product_id,
            b.batch_number,
            MAX(b.manufacturing_date) as manufacturing_date,
            MAX(b.ubd) as ubd,
            MAX(b.expiry_date) as expiry_date,
            MAX(b.shelf_life_days) as shelf_life_days,
            SUM(dm.opening_crt) as opening_crt,
            SUM(dm.opening_pc) as opening_pc,
            SUM(dm.opening_total) as opening_total,
            SUM(dm.production_crt) as production_crt,
            SUM(dm.production_pc) as production_pc,
            SUM(dm.production_total) as production_total,
            SUM(dm.sale_crt) as sale_crt,
            SUM(dm.sale_pc) as sale_pc,
            SUM(dm.sale_total) as sale_total,
            SUM(dm.sales_return_crt) as sales_return_crt,
            SUM(dm.sales_return_pc) as sales_return_pc,
            SUM(dm.sales_return_total) as sales_return_total,
            SUM(dm.demand_total) as demand_total,
            SUM(dm.closing_crt) as closing_crt,
            SUM(dm.closing_pc) as closing_pc,
            SUM(dm.closing_total) as closing_total
          FROM batches b
          JOIN daily_metrics dm ON dm.batch_id = b.id
          GROUP BY b.product_id, b.batch_number
          ORDER BY b.product_id, b.batch_number`,
  })

  // Product-level totals (no date filter)
  const productTotalsResult = await turso.execute({
    sql: `SELECT
            b.product_id,
            SUM(dm.production_total) as production_total,
            SUM(dm.production_crt) as production_crt,
            SUM(dm.production_pc) as production_pc,
            SUM(dm.sale_total) as sale_total,
            SUM(dm.sale_crt) as sale_crt,
            SUM(dm.sale_pc) as sale_pc,
            SUM(dm.sales_return_total) as sales_return_total,
            SUM(dm.demand_total) as demand_total,
            SUM(dm.closing_total) as closing_total,
            SUM(dm.closing_crt) as closing_crt,
            SUM(dm.closing_pc) as closing_pc,
            GROUP_CONCAT(DISTINCT b.batch_number) as batch_numbers,
            GROUP_CONCAT(DISTINCT b.ubd) as ubds,
            MAX(b.shelf_life_days) as shelf_life_days
          FROM batches b
          JOIN daily_metrics dm ON dm.batch_id = b.id
          GROUP BY b.product_id`,
  })

  // Group batches by product
  const batchesByProduct = new Map<string, any[]>()
  for (const row of batchResult.rows) {
    const pid = String(row.product_id)
    if (!batchesByProduct.has(pid)) batchesByProduct.set(pid, [])

    const closingCrt = Number(row.closing_crt ?? 0)
    const closingPc = Number(row.closing_pc ?? 0)
    const closingTotal = Number(row.closing_total ?? 0)

    // Only include batches with remaining stock or some activity
    if (closingTotal > 0 || Number(row.production_total ?? 0) > 0) {
      batchesByProduct.get(pid)!.push({
        batchNumber: String(row.batch_number || ""),
        manufacturingDate: row.manufacturing_date ? String(row.manufacturing_date) : null,
        ubd: row.ubd ? String(row.ubd) : null,
        expiryDate: row.expiry_date ? String(row.expiry_date) : null,
        shelfLifeDays: row.shelf_life_days !== null ? Number(row.shelf_life_days) : null,
        opening: { crt: Number(row.opening_crt ?? 0), pc: Number(row.opening_pc ?? 0), total: Number(row.opening_total ?? 0) },
        production: { crt: Number(row.production_crt ?? 0), pc: Number(row.production_pc ?? 0), total: Number(row.production_total ?? 0) },
        sale: { crt: Number(row.sale_crt ?? 0), pc: Number(row.sale_pc ?? 0), total: Number(row.sale_total ?? 0) },
        salesReturn: { crt: Number(row.sales_return_crt ?? 0), pc: Number(row.sales_return_pc ?? 0), total: Number(row.sales_return_total ?? 0) },
        closing: { crt: closingCrt, pc: closingPc, total: closingTotal },
        // Smallest unit display: e.g. "10 CRT 3 PC"
        closingDisplay: formatSmallestUnit(closingCrt, closingPc, closingTotal),
      })
    }
  }

  const productTotalsMap = new Map(
    productTotalsResult.rows.map(r => [String(r.product_id), r])
  )

  const categories = new Map<string, any[]>()

  for (const p of productsResult.rows) {
    const productId = String(p.id)
    const totals = productTotalsMap.get(productId)
    const category = String(p.category)

    if (!categories.has(category)) categories.set(category, [])

    const closingCrt = Number(totals?.closing_crt ?? 0)
    const closingPc = Number(totals?.closing_pc ?? 0)
    const closingTotal = Number(totals?.closing_total ?? 0)
    const pcsPerCrt = Number(p.pcs_per_crt || 1)

    categories.get(category)!.push({
      id: productId,
      name: p.name,
      skuCode: String(p.sku_code || ""),
      category,
      unit: p.unit,
      pcsPerCrt,
      shelfLifeDays: p.shelf_life_days ? Number(p.shelf_life_days) : null,
      hasEntry: !!totals,
      batchNumbers: totals?.batch_numbers ? String(totals.batch_numbers) : null,
      // Totals (all-time)
      productionTotal: Number(totals?.production_total ?? 0),
      productionCrt: Number(totals?.production_crt ?? 0),
      productionPc: Number(totals?.production_pc ?? 0),
      saleTotal: Number(totals?.sale_total ?? 0),
      saleCrt: Number(totals?.sale_crt ?? 0),
      salePc: Number(totals?.sale_pc ?? 0),
      salesReturnTotal: Number(totals?.sales_return_total ?? 0),
      demandTotal: Number(totals?.demand_total ?? 0),
      // Current stock (closing balance all-time)
      currentStockCrt: closingCrt,
      currentStockPc: closingPc,
      currentStockTotal: closingTotal,
      // Human-readable smallest-unit display
      currentStockDisplay: formatSmallestUnit(closingCrt, closingPc, closingTotal),
      batchesList: batchesByProduct.get(productId) || [],
    })
  }

  return Array.from(categories.entries()).map(([category, products]) => ({
    category,
    products,
  }))
}

/**
 * Format stock in smallest displayable units:
 * If crt > 0 and pc > 0: "10 CRT 3 PC"
 * If only crt: "10 CRT"
 * If only pc: "3 PC"
 * If total only (non-crt unit like KG/PCS): shows total
 */
function formatSmallestUnit(crt: number, pc: number, total: number): string {
  const parts: string[] = []
  if (crt > 0) parts.push(`${crt} CRT`)
  if (pc > 0) parts.push(`${pc} PC`)
  if (parts.length === 0) {
    return total > 0 ? `${total}` : "0"
  }
  return parts.join(" + ")
}
