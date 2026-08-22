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
  salesTarget?: number
  notes?: string
}

async function getPreviousClosing(productId: string, date: string): Promise<Qty> {
  const result = await turso.execute({
    sql: `SELECT dm.closing_crt, dm.closing_pc, dm.closing_total
          FROM daily_metrics dm
          JOIN batches b ON b.id = dm.batch_id
          WHERE b.product_id = ? AND b.date < ?
          ORDER BY b.date DESC
          LIMIT 1`,
    args: [productId, date],
  })

  if (result.rows.length === 0) {
    return { crt: 0, pc: 0, total: 0 }
  }

  const row = result.rows[0]
  return {
    crt: Number(row.closing_crt),
    pc: Number(row.closing_pc),
    total: Number(row.closing_total),
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
              sales_target = ?, notes = ?, updated_at = datetime('now')
            WHERE batch_id = ?`,
      args: [
        opening.crt, opening.pc, opening.total,
        production.crt, production.pc, production.total,
        demand.crt, demand.pc, demand.total,
        sale.crt, sale.pc, sale.total,
        salesTarget, notes ?? null, batchId,
      ],
    })
  } else {
    await turso.execute({
      sql: `INSERT INTO daily_metrics
              (id, batch_id, opening_crt, opening_pc, opening_total,
               production_crt, production_pc, production_total,
               demand_crt, demand_pc, demand_total,
               sale_crt, sale_pc, sale_total, sales_target, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        crypto.randomUUID(), batchId,
        opening.crt, opening.pc, opening.total,
        production.crt, production.pc, production.total,
        demand.crt, demand.pc, demand.total,
        sale.crt, sale.pc, sale.total,
        salesTarget, notes ?? null,
      ],
    })
  }

  return { batchId }
}

export async function getMetricsForDate(date: string) {
  const result = await turso.execute({
    sql: `SELECT p.id as product_id, p.name, p.sku_code, p.category, p.unit, COALESCE(p.pcs_per_crt, 1) as pcs_per_crt, COALESCE(p.shelf_life_days, 0) as product_shelf_life,
                 b.batch_number, b.manufacturing_date, b.ubd, b.expiry_date, b.shelf_life_days,
                 dm.opening_crt, dm.opening_pc, dm.opening_total,
                 dm.production_crt, dm.production_pc, dm.production_total,
                 dm.total_crt, dm.total_pc, dm.total_total,
                 dm.demand_crt, dm.demand_pc, dm.demand_total,
                 dm.sale_crt, dm.sale_pc, dm.sale_total,
                 dm.closing_crt, dm.closing_pc, dm.closing_total,
                 dm.sales_target
          FROM products p
          JOIN batches b ON b.product_id = p.id AND b.date = ?
          JOIN daily_metrics dm ON dm.batch_id = b.id
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
    sql: `SELECT p.id as product_id, b.batch_number, b.manufacturing_date, b.ubd, b.expiry_date, b.shelf_life_days,
                 dm.opening_crt, dm.opening_pc, dm.opening_total,
                 dm.production_crt, dm.production_pc, dm.production_total,
                 dm.total_crt, dm.total_pc, dm.total_total,
                 dm.demand_crt, dm.demand_pc, dm.demand_total,
                 dm.sale_crt, dm.sale_pc, dm.sale_total,
                 dm.closing_crt, dm.closing_pc, dm.closing_total,
                 dm.sales_target
          FROM products p
          JOIN batches b ON b.product_id = p.id AND b.date = ?
          JOIN daily_metrics dm ON dm.batch_id = b.id`,
    args: [date],
  })

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
      closing: { crt: Number(metrics?.closing_crt ?? 0), pc: Number(metrics?.closing_pc ?? 0), total: closingTotal },
      salesTarget: Number(metrics?.sales_target ?? 0),
      currentStock: closingTotal,
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
                 SUM(dm.sales_target) as sales_target
          FROM products p
          JOIN batches b ON b.product_id = p.id AND b.date >= ? AND b.date <= ?
          JOIN daily_metrics dm ON dm.batch_id = b.id
          GROUP BY p.id`,
    args: [startDate, endDate],
  })

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
    const closingTotal = opening.total + prodTotal - saleTotal

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
      closing: { crt: 0, pc: 0, total: closingTotal },
      salesTarget: Number(metrics?.sales_target ?? 0),
      currentStock: closingTotal,
    })
  }

  return Array.from(categories.entries()).map(([category, products]) => ({
    category,
    products,
  }))
}
