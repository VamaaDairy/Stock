CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sku_code TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'CRT',
  pcs_per_crt INTEGER NOT NULL DEFAULT 1,
  pack_label TEXT NOT NULL DEFAULT 'Crt/Box',
  shelf_life_days INTEGER DEFAULT 0
);

-- Ek row = ek product ka ek batch, ek particular date pe
CREATE TABLE IF NOT EXISTS batches (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id),
  date TEXT NOT NULL,                 -- 'YYYY-MM-DD'
  batch_number TEXT NOT NULL,         -- e.g. 'AA19HIM', 'AK17HIJ' (Tally format)
  manufacturing_date TEXT,           -- 'YYYY-MM-DD'
  ubd TEXT,                          -- Use Before Date 'YYYY-MM-DD'
  expiry_date TEXT,                  -- Hard Expiry Date 'YYYY-MM-DD'
  shelf_life_days INTEGER,          -- Shelf life in days
  created_at TEXT NOT NULL DEFAULT (datetime('now')),

  UNIQUE(product_id, date, batch_number)
);

CREATE INDEX IF NOT EXISTS idx_batches_product_date ON batches(product_id, date);
CREATE INDEX IF NOT EXISTS idx_batches_date ON batches(date);

-- Ek row = ek batch ka pura opening→production→demand→sale→closing cycle
CREATE TABLE IF NOT EXISTS daily_metrics (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL UNIQUE REFERENCES batches(id),

  -- OPENING (= kal ka closing)
  opening_crt REAL NOT NULL DEFAULT 0,
  opening_pc REAL NOT NULL DEFAULT 0,
  opening_total REAL NOT NULL DEFAULT 0,

  -- PRODUCTION (is batch mein kitna bana)
  production_crt REAL NOT NULL DEFAULT 0,
  production_pc REAL NOT NULL DEFAULT 0,
  production_total REAL NOT NULL DEFAULT 0,

  -- DEMAND (orders received)
  demand_crt REAL NOT NULL DEFAULT 0,
  demand_pc REAL NOT NULL DEFAULT 0,
  demand_total REAL NOT NULL DEFAULT 0,

  -- SALE (actual dispatches - stock is reduced by this)
  sale_crt REAL NOT NULL DEFAULT 0,
  sale_pc REAL NOT NULL DEFAULT 0,
  sale_total REAL NOT NULL DEFAULT 0,

  -- SALES TARGET
  sales_target REAL NOT NULL DEFAULT 0,

  -- TOTAL = Opening + Production (auto)
  total_crt REAL GENERATED ALWAYS AS (opening_crt + production_crt) STORED,
  total_pc REAL GENERATED ALWAYS AS (opening_pc + production_pc) STORED,
  total_total REAL GENERATED ALWAYS AS (opening_total + production_total) STORED,

  -- CLOSING = Total − Sale (auto; kal ka Opening banega)
  closing_crt REAL GENERATED ALWAYS AS (opening_crt + production_crt - sale_crt) STORED,
  closing_pc REAL GENERATED ALWAYS AS (opening_pc + production_pc - sale_pc) STORED,
  closing_total REAL GENERATED ALWAYS AS (opening_total + production_total - sale_total) STORED,

  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
