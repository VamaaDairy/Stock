-- ============================================================================
-- Vamaa Dairy Inventory & Production Management Database Schema
-- Database Engine: SQLite / Turso (libSQL)
-- ============================================================================

-- 1. PRODUCTS TABLE (Item Master synchronized with Tally ERP)
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,                       -- Unique ID (e.g. '1', '2')
  name TEXT NOT NULL,                        -- Stock Item Name (e.g. 'Gaia Toned Milk 500 ml')
  sku_code TEXT NOT NULL DEFAULT '',         -- Unique Item SKU Code (e.g. '1003', '1011')
  category TEXT NOT NULL,                    -- Category (e.g. 'Milk', 'UHT Milk', 'Dahi', 'Paneer', 'Ghee')
  unit TEXT NOT NULL DEFAULT 'CRT',          -- Primary Tally Unit ('CRT', 'CBX', 'PCS', 'KG')
  pcs_per_crt INTEGER NOT NULL DEFAULT 1,    -- Pack Conversion Factor (e.g. 60 Pcs per Crt)
  pack_label TEXT NOT NULL DEFAULT 'Crt/Box',-- Pack Unit Label Description
  shelf_life_days INTEGER DEFAULT 0,         -- Default Product Shelf Life in Days
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku_code);

-- 2. BATCHES TABLE (Daily Batch & Manufacturing Metadata)
CREATE TABLE IF NOT EXISTS batches (
  id TEXT PRIMARY KEY,                       -- UUID
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  date TEXT NOT NULL,                        -- Date in YYYY-MM-DD format
  batch_number TEXT NOT NULL,                -- Tally Batch Code (e.g. 'AA19HIM', 'AK17HIJ')
  manufacturing_date TEXT,                  -- Mfg Date YYYY-MM-DD
  ubd TEXT,                                 -- Use Before Date YYYY-MM-DD
  expiry_date TEXT,                         -- Expiry Date YYYY-MM-DD
  shelf_life_days INTEGER,                 -- Effective Shelf Life in Days
  created_at TEXT NOT NULL DEFAULT (datetime('now')),

  UNIQUE(product_id, date, batch_number)
);

CREATE INDEX IF NOT EXISTS idx_batches_product_date ON batches(product_id, date);
CREATE INDEX IF NOT EXISTS idx_batches_date ON batches(date);
CREATE INDEX IF NOT EXISTS idx_batches_batch_number ON batches(batch_number);

-- 3. DAILY_METRICS TABLE (Inventory Flow: Opening -> Production -> Demand -> Sale -> Closing)
CREATE TABLE IF NOT EXISTS daily_metrics (
  id TEXT PRIMARY KEY,                       -- UUID
  batch_id TEXT NOT NULL UNIQUE REFERENCES batches(id) ON DELETE CASCADE,

  -- OPENING BALANCE (Inherited from previous closing balance)
  opening_crt REAL NOT NULL DEFAULT 0,       -- Opening Crates / Boxes
  opening_pc REAL NOT NULL DEFAULT 0,        -- Opening Loose Pieces
  opening_total REAL NOT NULL DEFAULT 0,     -- Opening Total Primary Quantity

  -- DAILY PRODUCTION (Plant Batch Output)
  production_crt REAL NOT NULL DEFAULT 0,    -- Production Crates / Boxes
  production_pc REAL NOT NULL DEFAULT 0,     -- Production Loose Pieces
  production_total REAL NOT NULL DEFAULT 0,  -- Production Total Primary Quantity

  -- DAILY DEMAND (Customer Orders Received)
  demand_crt REAL NOT NULL DEFAULT 0,        -- Order Demand Crates / Boxes
  demand_pc REAL NOT NULL DEFAULT 0,         -- Order Demand Loose Pieces
  demand_total REAL NOT NULL DEFAULT 0,      -- Order Demand Total Primary Quantity

  -- DAILY SALE (Warehouse Dispatches OUT - Reduces Stock Balance)
  sale_crt REAL NOT NULL DEFAULT 0,          -- Dispatch Sale Crates / Boxes
  sale_pc REAL NOT NULL DEFAULT 0,           -- Dispatch Sale Loose Pieces
  sale_total REAL NOT NULL DEFAULT 0,        -- Dispatch Sale Total Primary Quantity

  -- TARGET METRICS
  sales_target REAL NOT NULL DEFAULT 0,      -- Sales Target Quantity

  -- TOTAL AVAILABLE = Opening + Production (Stored Auto-Column)
  total_crt REAL GENERATED ALWAYS AS (opening_crt + production_crt) STORED,
  total_pc REAL GENERATED ALWAYS AS (opening_pc + production_pc) STORED,
  total_total REAL GENERATED ALWAYS AS (opening_total + production_total) STORED,

  -- CLOSING STOCK BALANCE = Total Available - Sale (Stored Auto-Column)
  closing_crt REAL GENERATED ALWAYS AS (opening_crt + production_crt - sale_crt) STORED,
  closing_pc REAL GENERATED ALWAYS AS (opening_pc + production_pc - sale_pc) STORED,
  closing_total REAL GENERATED ALWAYS AS (opening_total + production_total - sale_total) STORED,

  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_daily_metrics_batch ON daily_metrics(batch_id);
