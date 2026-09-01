PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL
    , role TEXT NOT NULL DEFAULT 'viewer');
INSERT INTO users VALUES(2,'darshan@vamaadairy.com','$2b$10$b/4cwNN5U59dH6pPBpC7..SV9aIu8UwxUtZhSBbYmNBbv9sPs3Ef.','Darshan','admin');
INSERT INTO users VALUES(3,'mis@vamaadairy.com','$2b$10$cSc7.xvi4rmUqGsYlKT6mOiJGFxghsn0E6h3pfgFOALU7ZMD7bbGW','MIS','viewer');
INSERT INTO users VALUES(4,'purchase@vamaadairy.com','$2b$10$bw7yOBoD8IgwykcwoqBZi.XKVNeQ0vEB50yaCz5W6KYjFG6rPDyRK','Mohit Sahu','manager');
INSERT INTO users VALUES(6,'lab@vamaadairy.com','$2b$10$eY7PdOTZha2rnQ7h1FvWUOxW2aN9CBjoXc90WPe/tYtYqxUtrvVTC','Head of Plant','manager');
INSERT INTO users VALUES(7,'production@vamaadairy.com','$2b$10$8aKQUP3W8cx1PPtpCDy8qOPIl/wBFlHPYGMO66CqGsDSPlrMQf/q.','Manish','manager');
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
INSERT INTO products VALUES('1','Gaia Doodh Toned 500ml- Pkt','1003','Milk','CRT',24,'Crt/Box',2,'2026-08-24 08:29:01');
INSERT INTO products VALUES('2','Gaia Cow Milk 500 ML (Crt)','999','Milk','CRT',24,'Crt/Box',2,'2026-08-24 08:29:01');
INSERT INTO products VALUES('3','Gaia Maxx UHT 110ml','1042','UHT Milk','CBX',40,'Crt/Box',90,'2026-08-24 08:29:01');
INSERT INTO products VALUES('4','Gaia Maxx UHT 400ml','1045','UHT Milk','CBX',20,'Crt/Box',90,'2026-08-24 08:29:01');
INSERT INTO products VALUES('5','Gaia Premium Milk UHT Tetra Pack 1 Ltr','1050','UHT Milk','CBX',12,'Crt/Box',180,'2026-08-24 08:29:01');
INSERT INTO products VALUES('6','Gaia Lite Milk UHT Tetra Pack 1Ltr','1051','UHT Milk','CBX',12,'Crt/Box',180,'2026-08-24 08:29:01');
INSERT INTO products VALUES('7','Gaia Gold Milk UHT Tetra Pack 1Ltr','1052','UHT Milk','CBX',12,'Crt/Box',180,'2026-08-24 08:29:01');
INSERT INTO products VALUES('8','Gaia Dahi (Crt) 200 Gms 60 Pkt','1012','Dahi','CRT',60,'Crt/Box',16,'2026-08-24 08:29:01');
INSERT INTO products VALUES('9','Gaia Dahi 400 Gms (Crt) 30 Pkt','1013','Dahi','CRT',30,'Crt/Box',16,'2026-08-24 08:29:01');
INSERT INTO products VALUES('10','Gaia Dahi 1 Kg- 12 Packets','1014','Dahi','CRT',12,'Crt/Box',16,'2026-08-24 08:29:01');
INSERT INTO products VALUES('11','Gaia Dahi 5kg Pouch (2pcs)','1015','Dahi','CRT',2,'Crt/Box',16,'2026-08-24 08:29:02');
INSERT INTO products VALUES('12','Gaia Dahi  Bucket 5 Kg','1047','Dahi','PCS',1,'Crt/Box',16,'2026-08-24 08:29:02');
INSERT INTO products VALUES('13','Gaia Dahi  Bucket 15 Kg','1016','Dahi','PCS',1,'Crt/Box',16,'2026-08-24 08:29:02');
INSERT INTO products VALUES('14','Gaia Dahi Cup 200 Gms Box(6Pc)','1056','Dahi','CBX',6,'Crt/Box',16,'2026-08-24 08:29:02');
INSERT INTO products VALUES('15','Gaia Dahi (Cup) 200 Gms','1011','Dahi','CBX',30,'Crt/Box',17,'2026-08-24 08:29:02');
INSERT INTO products VALUES('16','Gaia Mishti Doi 80g','1010','Dahi','CBX',12,'Crt/Box',16,'2026-08-24 08:29:02');
INSERT INTO products VALUES('17','Gaia Premium Sweet Dahi (Lychee) Cup 90 Gms','1026','Dahi','CBX',12,'Crt/Box',16,'2026-08-24 08:29:02');
INSERT INTO products VALUES('18','Gaia Premium Sweet Dahi (Muskmelon) Cup 90 Gms  O','1027','Dahi','PCS',1,'Crt/Box',7,'2026-08-24 08:29:02');
INSERT INTO products VALUES('19','Gaia Kadhi Dahi (Crt) 200 Gm 60 Pkt','1020','Kadhi Dahi','CRT',60,'Crt/Box',16,'2026-08-24 08:29:02');
INSERT INTO products VALUES('20','Gaia Kadhi Dahi 1 Kg Crt (12 Pcs)','1019','Kadhi Dahi','CRT',12,'Crt/Box',16,'2026-08-24 08:29:02');
INSERT INTO products VALUES('21','Gaia Kadhi Dahi 5kg Pouch (2 Pcs)','1021','Kadhi Dahi','CRT',2,'Crt/Box',16,'2026-08-24 08:29:02');
INSERT INTO products VALUES('22','Gaia Kadhi Dahi Bucket 5 KG','1018','Kadhi Dahi','PCS',1,'Crt/Box',16,'2026-08-24 08:29:02');
INSERT INTO products VALUES('23','Gaia Kadhi Dahi Bucket 15 Kg','1022','Kadhi Dahi','PCS',1,'Crt/Box',16,'2026-08-24 08:29:02');
INSERT INTO products VALUES('24','Gaia Plain Lassi 180 Ml (Glass Cup 10)','1023','Lassi','CBX',10,'Crt/Box',11,'2026-08-24 08:29:02');
INSERT INTO products VALUES('25','Mango Lassi 180 Ml - 10Pcs','1024','Lassi','CBX',10,'Crt/Box',11,'2026-08-24 08:29:02');
INSERT INTO products VALUES('26','Gaia Masala Chaas 180 ML Glass','1046','Lassi','CBX',10,'Crt/Box',9,'2026-08-24 08:29:02');
INSERT INTO products VALUES('27','Gaia Sweet Lassi 180ml Pouch','1028','Lassi','CRT',24,'Crt/Box',3,'2026-08-24 08:29:02');
INSERT INTO products VALUES('28','Strawberry Lassi 180 Ml - 10 Pcs','1049','Lassi','CBX',10,'Crt/Box',11,'2026-08-24 08:29:02');
INSERT INTO products VALUES('29','Gaia Paneer 200gms','1005','Paneer','PCS',1,'Crt/Box',17,'2026-08-24 08:29:02');
INSERT INTO products VALUES('30','Gaia Paneer 500Gms','1006','Paneer','PCS',1,'Crt/Box',17,'2026-08-24 08:29:03');
INSERT INTO products VALUES('31','Gaia Paneer 1kg','1007','Paneer','PCS',1,'Crt/Box',17,'2026-08-24 08:29:03');
INSERT INTO products VALUES('32','Loose 1 Kg','1008','Paneer','PCS',1,'Crt/Box',5,'2026-08-24 08:29:03');
INSERT INTO products VALUES('33','Loose 5 Kg','1009','Paneer','PCS',1,'Crt/Box',5,'2026-08-24 08:29:03');
INSERT INTO products VALUES('34','Gaia Premium Desi Ghee 20ml','1055','Ghee','CBX',100,'Crt/Box',270,'2026-08-24 08:29:03');
INSERT INTO products VALUES('35','Gaia Ghee 200 ML Jar','1029','Ghee','CBX',24,'Crt/Box',270,'2026-08-24 08:29:03');
INSERT INTO products VALUES('36','Gaia Ghee 500 ML Jar','1030','Ghee','CBX',12,'Crt/Box',270,'2026-08-24 08:29:03');
INSERT INTO products VALUES('37','Gaia  Ghee 1 Ltr Jar 18','1031','Ghee','CBX',12,'Crt/Box',270,'2026-08-24 08:29:03');
INSERT INTO products VALUES('38','Gaia Ghee Ceka Pack 1ltr','1038','Ghee','CBX',12,'Crt/Box',270,'2026-08-24 08:29:03');
INSERT INTO products VALUES('39','Gaia Premium Desi Ghee Ceka Pack 900ml','1053','Ghee','CBX',12,'Crt/Box',270,'2026-08-24 08:29:03');
INSERT INTO products VALUES('40','Gaia Ghee 5 Ltr.Jar','1032','Ghee','CBX',4,'Crt/Box',270,'2026-08-24 08:29:03');
INSERT INTO products VALUES('41','Gaia Cow Ghee 200 Ml Jar','1039','Ghee','CBX',24,'Crt/Box',270,'2026-08-24 08:29:03');
INSERT INTO products VALUES('42','Gaia Cow Ghee 500 Ml Jar','1040','Ghee','CBX',12,'Crt/Box',270,'2026-08-24 08:29:03');
INSERT INTO products VALUES('43','Gaia Cow Ghee 1Ltr Jar','1041','Ghee','CBX',12,'Crt/Box',270,'2026-08-24 08:29:03');
INSERT INTO products VALUES('44','Gaia Pure Cow Ghee Ceka Pack 900ml','1054','Ghee','CBX',12,'Crt/Box',270,'2026-08-24 08:29:03');
INSERT INTO products VALUES('45','Gaia Cow Ghee Ceka Pack 1ltr','1037','Ghee','CBX',12,'Crt/Box',270,'2026-08-24 08:29:03');
INSERT INTO products VALUES('46','Gaia Ghee 15 Kilogram','1033','Ghee','PCS',1,'Crt/Box',270,'2026-08-24 08:29:03');
INSERT INTO products VALUES('47','Gaia Shahi Rabdi 80g  (1cup*12pcs)','1048','Sweets','CBX',12,'Crt/Box',11,'2026-08-24 08:29:03');
INSERT INTO products VALUES('48','Gaia Shrikhand KE 80g','1043','Shrikhand','CBX',12,'Crt/Box',30,'2026-08-24 08:29:04');
INSERT INTO products VALUES('49','Gaia Shrikhand KE 80g-Box (6Pc)','1044','Shrikhand','CBX',12,'Crt/Box',30,'2026-08-24 08:29:04');
INSERT INTO products VALUES('50','Gaia Peda 200 Gm Pcs','1034','Peda','CBX',15,'Crt/Box',40,'2026-08-24 08:29:04');
INSERT INTO products VALUES('51','Gaia Kesar Peda 200 Gm Pcs','1035','Peda','CBX',15,'Crt/Box',40,'2026-08-24 08:29:04');
INSERT INTO products VALUES('52','Khowa White ( Unsweetened )','1058','Khowa','KG',1,'Crt/Box',180,'2026-08-24 08:29:04');
INSERT INTO products VALUES('53','Khowa Brown ( Unsweetened )','1059','Khowa','KG',1,'Crt/Box',180,'2026-08-24 08:29:04');
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
INSERT INTO batches VALUES('68816a7c-2775-4a26-ae61-bfa18f94a49a','13','2026-08-31','AA29HIO','2026-08-29','2026-09-14','2026-09-14',16,'2026-08-31 07:12:32');
INSERT INTO batches VALUES('18656e0b-2fe7-49c8-bbdd-38e2de36149c','12','2026-08-31','AA29HIN','2026-08-29','2026-09-14','2026-09-14',16,'2026-08-31 07:12:54');
INSERT INTO batches VALUES('c3cc470a-53f9-4bde-a5ad-49c67e6bcbc3','12','2026-08-31','AA26HIN','2026-08-26','2026-09-11','2026-09-11',16,'2026-08-31 07:13:12');
INSERT INTO batches VALUES('266ce884-0356-4d91-bdd3-b8fef806d5eb','8','2026-08-31','AA30HIJ','2026-08-30','2026-09-15','2026-09-15',16,'2026-08-31 07:13:44');
INSERT INTO batches VALUES('daedcb95-cb1e-497a-88f8-e495a2823522','8','2026-08-31','AA29HIJ','2026-08-29','2026-09-14','2026-09-14',16,'2026-08-31 07:14:06');
INSERT INTO batches VALUES('eae04a31-8b0b-437c-a10f-dc69936bb4a1','10','2026-08-31','AA30HIM','2026-08-30','2026-09-15','2026-09-15',16,'2026-08-31 07:14:59');
INSERT INTO batches VALUES('2da3c096-b9cf-46e8-b68c-69e67689e24f','10','2026-08-31','AA29HIM','2026-08-29','2026-09-14','2026-09-14',16,'2026-08-31 07:15:21');
INSERT INTO batches VALUES('7a0847f0-c93a-4870-ae20-a85cef35e1f6','9','2026-08-31','AA23HIK','2026-08-23','2026-09-08','2026-09-08',16,'2026-08-31 07:15:54');
INSERT INTO batches VALUES('8f17f118-7ba3-4110-ba36-3d74b0c8ae4a','11','2026-08-31','AA29HIN','2026-08-29','2026-09-14','2026-09-14',16,'2026-08-31 07:16:15');
INSERT INTO batches VALUES('d3d10812-9ac5-4808-ac61-70a84c0046e8','11','2026-08-31','AA30HIN','2026-08-30','2026-09-15','2026-09-15',16,'2026-08-31 07:16:27');
INSERT INTO batches VALUES('081eea14-9c46-4bde-8d5d-45ba8ea7a6d4','19','2026-08-31','AB29HIJ','2026-08-29','2026-09-14','2026-09-14',16,'2026-08-31 07:17:15');
INSERT INTO batches VALUES('2ceefcac-2748-401f-908b-8f027df8dbd0','19','2026-08-31','AB30HIJ','2026-08-30','2026-09-15','2026-09-15',16,'2026-08-31 07:17:31');
INSERT INTO batches VALUES('6396a47b-cfa1-4aea-bb62-ca83d8aa81af','20','2026-08-31','AB29HIM','2026-08-29','2026-09-14','2026-09-14',16,'2026-08-31 07:17:52');
INSERT INTO batches VALUES('c6b7fb14-e2a9-41e8-94f2-1f182ba53f14','20','2026-08-31','AB30HIM','2026-08-30','2026-09-15','2026-09-15',16,'2026-08-31 07:18:14');
INSERT INTO batches VALUES('50cd25e6-f1af-4287-910c-f15efdac260e','21','2026-08-31','AB29HIN','2026-08-29','2026-09-14','2026-09-14',16,'2026-08-31 07:18:37');
INSERT INTO batches VALUES('6c18be6f-0742-4823-ba0e-9e5dc6d3b72f','21','2026-08-31','AB30HIN','2026-08-30','2026-09-15','2026-09-15',16,'2026-08-31 07:18:50');
INSERT INTO batches VALUES('04324580-b3da-4e6f-9974-f755ec43292c','23','2026-08-31','AB29HIO','2026-08-29','2026-09-14','2026-09-14',16,'2026-08-31 07:19:13');
INSERT INTO batches VALUES('27c6ee05-a074-40ea-a92a-cbb86de290a1','53','2026-08-31','AP29HIM','2026-08-29','2026-09-03','2026-09-03',0,'2026-08-31 07:19:33');
INSERT INTO batches VALUES('3ab935ef-330c-4e7e-b899-d808e1975cb8','47','2026-08-31','AV29HIQ','2026-08-29','2026-09-09','2026-09-09',11,'2026-08-31 07:21:21');
INSERT INTO batches VALUES('e01bada1-a18c-40b7-bd94-94bba3766da2','1','2026-08-31','AR31HIL','2026-08-31','2026-09-02','2026-09-02',2,'2026-08-31 08:37:41');
INSERT INTO batches VALUES('eea3f254-a4fb-4767-9a29-953cd912d8aa','2','2026-08-31','AS31HID','2026-08-31','2026-09-02','2026-09-02',2,'2026-08-31 08:38:55');
INSERT INTO batches VALUES('8bdb63a9-0e85-4bb3-9d31-4a334ebe8013','35','2026-08-31','AL03HIJ','2026-08-03','2027-04-30','2027-04-30',270,'2026-08-31 08:42:21');
INSERT INTO batches VALUES('75559530-dc11-4759-b005-31b4417fa7cb','42','2026-08-31','AM07HIL','2026-08-07','2027-04-30','2027-04-30',266,'2026-08-31 08:43:00');
INSERT INTO batches VALUES('7acd79a4-5f93-4648-9d9c-01b169555c62','45','2026-08-31','AL29GIM','2026-07-29','2027-03-26','2027-03-26',240,'2026-08-31 08:44:24');
INSERT INTO batches VALUES('ea908fd6-dce1-46a0-b9d7-75dc68b44b7f','29','2026-08-31','AK29HIJ','2026-08-29','2026-09-15','2026-09-15',17,'2026-08-31 08:49:11');
INSERT INTO batches VALUES('5499dfbc-6e5b-4d4d-99d7-7d8ad11281ae','30','2026-08-31','AK29HIL','2026-08-29','2026-09-15','2026-09-15',17,'2026-08-31 08:49:32');
INSERT INTO batches VALUES('93a65552-6e11-42fc-9af7-15c6a446c4ce','47','2026-08-31','AV31HIQ','2026-08-31','2026-09-11','2026-09-11',11,'2026-08-31 13:51:18');
INSERT INTO batches VALUES('3d502358-c336-41fd-a6b9-1857eaca2691','13','2026-09-01','AA31HIO','2026-08-31','2026-09-16','2026-09-16',16,'2026-09-01 05:00:41');
INSERT INTO batches VALUES('dc4517a9-aff2-41c1-bd82-345f8f13faee','31','2026-09-01','AK31HIM','2026-08-31','2026-09-17','2026-09-17',17,'2026-09-01 05:01:24');
INSERT INTO batches VALUES('f35d8519-a663-4df7-b6e3-5ccb534dbd7c','29','2026-09-01','AK31HIJ','2026-08-31','2026-09-17','2026-09-17',17,'2026-09-01 05:01:36');
INSERT INTO batches VALUES('106c63af-1092-41d7-a71d-e061c1e2013d','30','2026-09-01','AK31HIL','2026-08-31','2026-09-17','2026-09-17',17,'2026-09-01 05:01:51');
INSERT INTO batches VALUES('8464d3f9-479d-4a8b-973d-bb361bd494bd','47','2026-08-29','AV31HIQ','2026-08-31','2026-09-11','2026-09-11',11,'2026-09-01 07:41:11');
INSERT INTO batches VALUES('d3aa9116-cc07-4bc2-9909-e3259d4a6e42','31','2026-08-31','AK31HIM','2026-08-31','2026-09-17','2026-09-17',17,'2026-09-01 07:59:02');
INSERT INTO batches VALUES('74a6be16-ead5-4692-be0d-4eafe90108d4','30','2026-08-31','AK31HIL','2026-08-31','2026-09-17','2026-09-17',17,'2026-09-01 07:59:13');
INSERT INTO batches VALUES('0e63698e-5c60-4925-b275-00c983d56898','29','2026-08-31','AK31HIJ','2026-08-31','2026-09-17','2026-09-17',17,'2026-09-01 07:59:49');
INSERT INTO batches VALUES('d92650d5-8a0e-4bab-8ea9-59c02db9ee44','2','2026-09-01','AS01IIL','2026-09-01','2026-09-03','2026-09-03',2,'2026-09-01 08:18:48');
INSERT INTO batches VALUES('6d9ba6ac-3622-4cde-ba5a-b052d5b332e1','1','2026-09-01','AR01IIL','2026-09-01','2026-09-03','2026-09-03',2,'2026-09-01 08:19:15');
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

  -- DAILY SALES RETURN (Returned Stock IN - Increases Stock Balance)
  sales_return_crt REAL NOT NULL DEFAULT 0,  -- Sales Return Crates / Boxes
  sales_return_pc REAL NOT NULL DEFAULT 0,   -- Sales Return Loose Pieces
  sales_return_total REAL NOT NULL DEFAULT 0, -- Sales Return Total Primary Quantity

  -- TARGET METRICS
  sales_target REAL NOT NULL DEFAULT 0,      -- Sales Target Quantity

  -- TOTAL AVAILABLE = Opening + Production + Sales Return (Stored Auto-Column)
  total_crt REAL GENERATED ALWAYS AS (opening_crt + production_crt + sales_return_crt) STORED,
  total_pc REAL GENERATED ALWAYS AS (opening_pc + production_pc + sales_return_pc) STORED,
  total_total REAL GENERATED ALWAYS AS (opening_total + production_total + sales_return_total) STORED,

  -- CLOSING STOCK BALANCE = Total Available - Sale (Stored Auto-Column)
  closing_crt REAL GENERATED ALWAYS AS (opening_crt + production_crt + sales_return_crt - sale_crt) STORED,
  closing_pc REAL GENERATED ALWAYS AS (opening_pc + production_pc + sales_return_pc - sale_pc) STORED,
  closing_total REAL GENERATED ALWAYS AS (opening_total + production_total + sales_return_total - sale_total) STORED,

  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
INSERT INTO daily_metrics VALUES('4a0be9ed-8ff5-49c7-ab51-4370deeb6c53','68816a7c-2775-4a26-ae61-bfa18f94a49a',0,0,0,126,126,126,0,0,0,55,55,55,0,0,0,0,NULL,'2026-08-31 07:12:32','2026-09-01 08:00:29');
INSERT INTO daily_metrics VALUES('3545a88e-b2d8-44b8-9b07-b06524c773ff','18656e0b-2fe7-49c8-bbdd-38e2de36149c',0,0,0,105,105,105,0,0,0,0,0,0,0,0,0,0,NULL,'2026-08-31 07:12:55','2026-08-31 09:15:49');
INSERT INTO daily_metrics VALUES('fdd4a82e-1c1e-4ea0-9902-600e02800e80','c3cc470a-53f9-4bde-a5ad-49c67e6bcbc3',0,0,0,36,36,36,0,0,0,26,26,26,0,0,0,0,NULL,'2026-08-31 07:13:13','2026-09-01 08:00:28');
INSERT INTO daily_metrics VALUES('cd14e85d-6eb7-41d3-9fa1-a62cff9c1a53','266ce884-0356-4d91-bdd3-b8fef806d5eb',0,0,0,86,0,5160,0,0,0,0,0,0,0,0,0,0,NULL,'2026-08-31 07:13:44','2026-08-31 09:15:49');
INSERT INTO daily_metrics VALUES('274d8db6-4c3f-4b21-afe6-ab575fbd9e1d','daedcb95-cb1e-497a-88f8-e495a2823522',0,0,0,27,45,1665,0,0,0,20,202,1402,0,0,0,0,NULL,'2026-08-31 07:14:06','2026-09-01 08:00:22');
INSERT INTO daily_metrics VALUES('5267f76d-1f37-47a2-87fb-a9f0e8d2311c','eae04a31-8b0b-437c-a10f-dc69936bb4a1',0,0,0,128,1,1537,0,0,0,2,0,24,0,0,0,0,NULL,'2026-08-31 07:14:59','2026-09-01 08:00:10');
INSERT INTO daily_metrics VALUES('b50d98bc-fcb3-4b12-9931-028e8a485e61','2da3c096-b9cf-46e8-b68c-69e67689e24f',0,0,0,84,2,1010,0,0,0,87,99,1143,0,0,0,0,NULL,'2026-08-31 07:15:21','2026-09-01 08:00:27');
INSERT INTO daily_metrics VALUES('101009d1-852b-4b21-8cbc-8a51706acd35','7a0847f0-c93a-4870-ae20-a85cef35e1f6',0,0,0,4,18,138,0,0,0,0,6,6,0,0,0,0,NULL,'2026-08-31 07:15:55','2026-09-01 07:59:12');
INSERT INTO daily_metrics VALUES('133eb758-d2b7-4925-afb9-275d183c5b7a','8f17f118-7ba3-4110-ba36-3d74b0c8ae4a',0,0,0,65,1,131,0,0,0,65,1,131,0,0,0,0,NULL,'2026-08-31 07:16:15','2026-09-01 08:00:29');
INSERT INTO daily_metrics VALUES('d283facc-481b-46a6-a161-90a34a073a13','d3d10812-9ac5-4808-ac61-70a84c0046e8',0,0,0,51,1,103,0,0,0,14,1,29,0,0,0,0,NULL,'2026-08-31 07:16:27','2026-09-01 08:00:10');
INSERT INTO daily_metrics VALUES('33324b12-13d9-4467-af8e-f1ac23504bb0','081eea14-9c46-4bde-8d5d-45ba8ea7a6d4',0,0,0,23,12,1392,0,0,0,6,272,632,0,0,0,0,NULL,'2026-08-31 07:17:15','2026-09-01 07:59:57');
INSERT INTO daily_metrics VALUES('0b81f717-461f-4d5f-88f5-5af3ac690af6','2ceefcac-2748-401f-908b-8f027df8dbd0',0,0,0,40,0,2400,0,0,0,0,0,0,0,0,0,0,NULL,'2026-08-31 07:17:31','2026-08-31 09:15:49');
INSERT INTO daily_metrics VALUES('613b6280-d012-4400-8d16-d160129b8c9d','6396a47b-cfa1-4aea-bb62-ca83d8aa81af',0,0,0,32,0,384,0,0,0,14,99,267,0,0,0,0,NULL,'2026-08-31 07:17:52','2026-09-01 08:00:21');
INSERT INTO daily_metrics VALUES('a4cd67f8-b9d7-4257-ad10-32b18760c7d0','c6b7fb14-e2a9-41e8-94f2-1f182ba53f14',0,0,0,45,5,545,0,0,0,0,0,0,0,0,0,0,NULL,'2026-08-31 07:18:14','2026-08-31 09:15:49');
INSERT INTO daily_metrics VALUES('4b35f887-7f68-4c35-ac19-34dd5f6389b2','50cd25e6-f1af-4287-910c-f15efdac260e',0,0,0,11,1,23,0,0,0,11,1,23,0,0,0,0,NULL,'2026-08-31 07:18:37','2026-09-01 07:59:23');
INSERT INTO daily_metrics VALUES('98e4a278-d082-42d5-9a5e-73e831cdae0f','6c18be6f-0742-4823-ba0e-9e5dc6d3b72f',0,0,0,42,0,84,0,0,0,15,1,31,0,0,0,0,NULL,'2026-08-31 07:18:50','2026-09-01 08:00:22');
INSERT INTO daily_metrics VALUES('16b49b35-2c3d-4a05-9661-78f6c62812b6','04324580-b3da-4e6f-9974-f755ec43292c',0,0,0,16,16,16,0,0,0,7,7,7,0,0,0,0,NULL,'2026-08-31 07:19:13','2026-09-01 08:00:19');
INSERT INTO daily_metrics VALUES('daebe910-a518-4d27-82b7-8e7fc710b58c','27c6ee05-a074-40ea-a92a-cbb86de290a1',0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,NULL,'2026-08-31 07:19:33','2026-08-31 09:15:49');
INSERT INTO daily_metrics VALUES('4d3faa10-1124-47fc-b94a-1be0763d5439','3ab935ef-330c-4e7e-b899-d808e1975cb8',0,0,0,47,6,570,0,0,0,45,30,570,0,0,0,0,NULL,'2026-08-31 07:21:21','2026-09-01 07:59:44');
INSERT INTO daily_metrics VALUES('7485ad80-6caf-47c5-b52e-65946fd55cba','e01bada1-a18c-40b7-bd94-94bba3766da2',0,0,0,150,0,3600,0,0,0,148,24,3576,0,0,0,0,NULL,'2026-08-31 08:37:41','2026-09-01 08:00:18');
INSERT INTO daily_metrics VALUES('018ab783-0cd6-454b-862d-45542edccfa3','eea3f254-a4fb-4767-9a29-953cd912d8aa',0,0,0,24,0,576,0,0,0,23,15,567,0,0,0,0,NULL,'2026-08-31 08:38:55','2026-09-01 08:00:04');
INSERT INTO daily_metrics VALUES('97fc7fac-9873-47a6-a906-825dd14c5f07','8bdb63a9-0e85-4bb3-9d31-4a334ebe8013',0,0,0,14,0,336,0,0,0,14,0,336,0,0,0,0,NULL,'2026-08-31 08:42:21','2026-09-01 07:59:33');
INSERT INTO daily_metrics VALUES('96ef8c0a-2534-4ee8-a075-77dbb7e020c2','75559530-dc11-4759-b005-31b4417fa7cb',0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,NULL,'2026-08-31 08:43:00','2026-08-31 10:45:23');
INSERT INTO daily_metrics VALUES('9bce9195-eeb3-4c81-9b4a-772be8a122c9','7acd79a4-5f93-4648-9d9c-01b169555c62',0,0,0,32,0,576,0,0,0,41,6,576,0,0,0,0,NULL,'2026-08-31 08:44:24','2026-09-01 07:59:46');
INSERT INTO daily_metrics VALUES('81458107-3f57-448b-a234-1f8380d7e34e','ea908fd6-dce1-46a0-b9d7-75dc68b44b7f',0,0,0,385,385,385,0,0,0,385,385,385,0,0,0,0,NULL,'2026-08-31 08:49:11','2026-09-01 07:59:49');
INSERT INTO daily_metrics VALUES('4e530ac1-f069-4d63-82c3-b3925fbbdf41','5499dfbc-6e5b-4d4d-99d7-7d8ad11281ae',0,0,0,67,67,67,0,0,0,67,67,67,0,0,0,0,NULL,'2026-08-31 08:49:32','2026-08-31 09:21:55');
INSERT INTO daily_metrics VALUES('7233b99e-6901-4d6a-aaec-15e3be16ed15','93a65552-6e11-42fc-9af7-15c6a446c4ce',0,0,0,69,0,414,0,0,0,354,0,2124,0,0,0,0,NULL,'2026-08-31 13:51:18','2026-08-31 13:53:00');
INSERT INTO daily_metrics VALUES('dca234ae-fb5f-4ef4-8e06-ed9411e87224','3d502358-c336-41fd-a6b9-1857eaca2691',126,126,126,0,0,0,0,0,0,0,0,0,0,0,0,0,NULL,'2026-09-01 05:00:41','2026-09-01 05:00:41');
INSERT INTO daily_metrics VALUES('93119bbe-b18b-4c82-8942-3b96de39e3c5','dc4517a9-aff2-41c1-bd82-345f8f13faee',0,0,0,861,861,861,0,0,0,0,0,0,0,0,0,0,NULL,'2026-09-01 05:01:24','2026-09-01 05:01:24');
INSERT INTO daily_metrics VALUES('45f16dbc-e882-4fd2-bd12-889b02a4bc89','f35d8519-a663-4df7-b6e3-5ccb534dbd7c',191,191,191,133,133,133,0,0,0,0,0,0,0,0,0,0,NULL,'2026-09-01 05:01:37','2026-09-01 05:01:37');
INSERT INTO daily_metrics VALUES('e00fd5b3-6b9f-4037-b93e-8b827ad8e7dc','106c63af-1092-41d7-a71d-e061c1e2013d',0,0,0,198,198,198,0,0,0,0,0,0,0,0,0,0,NULL,'2026-09-01 05:01:51','2026-09-01 05:01:51');
INSERT INTO daily_metrics VALUES('294cadcf-4598-4112-8143-4f96910d944f','8464d3f9-479d-4a8b-973d-bb361bd494bd',0,0,0,34,6,414,0,0,0,413,0,4956,0,0,0,0,NULL,'2026-09-01 07:41:11','2026-09-01 07:41:29');
INSERT INTO daily_metrics VALUES('901661f8-c671-40e3-9613-5475560503db','d3aa9116-cc07-4bc2-9909-e3259d4a6e42',0,0,0,0,0,0,0,0,0,848,848,848,0,0,0,0,NULL,'2026-09-01 07:59:02','2026-09-01 08:00:30');
INSERT INTO daily_metrics VALUES('8cd29b97-f86e-4902-9b76-abc3c5fc4feb','74a6be16-ead5-4692-be0d-4eafe90108d4',0,0,0,0,0,0,0,0,0,198,198,198,0,0,0,0,NULL,'2026-09-01 07:59:14','2026-09-01 07:59:53');
INSERT INTO daily_metrics VALUES('f05f36df-718d-4414-a84c-cb77de444ad4','0e63698e-5c60-4925-b275-00c983d56898',0,0,0,0,0,0,0,0,0,288,288,288,0,0,0,0,NULL,'2026-09-01 07:59:49','2026-09-01 08:00:24');
INSERT INTO daily_metrics VALUES('f5e91853-3db3-4ec2-8317-8901cc271e91','d92650d5-8a0e-4bab-8ea9-59c02db9ee44',0,9,9,30,0,720,0,0,0,0,0,0,0,0,0,0,NULL,'2026-09-01 08:18:48','2026-09-01 08:19:30');
INSERT INTO daily_metrics VALUES('c3ae4506-1e0b-4390-97bb-864f20b3a65d','6d9ba6ac-3622-4cde-ba5a-b052d5b332e1',1,0,24,165,0,3960,0,0,0,0,0,0,0,0,0,0,NULL,'2026-09-01 08:19:15','2026-09-01 08:19:15');
CREATE TABLE IF NOT EXISTS role_permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role TEXT NOT NULL,
      page TEXT NOT NULL,
      can_access INTEGER NOT NULL DEFAULT 1,
      UNIQUE(role, page)
    );
INSERT INTO role_permissions VALUES(1,'admin','dashboard',1);
INSERT INTO role_permissions VALUES(2,'admin','production',1);
INSERT INTO role_permissions VALUES(3,'admin','sales',1);
INSERT INTO role_permissions VALUES(4,'admin','sales-return',1);
INSERT INTO role_permissions VALUES(5,'admin','products',1);
INSERT INTO role_permissions VALUES(6,'admin','about',1);
INSERT INTO role_permissions VALUES(7,'admin','settings',1);
INSERT INTO role_permissions VALUES(8,'manager','dashboard',0);
INSERT INTO role_permissions VALUES(9,'manager','production',1);
INSERT INTO role_permissions VALUES(10,'manager','sales',1);
INSERT INTO role_permissions VALUES(11,'manager','sales-return',1);
INSERT INTO role_permissions VALUES(12,'manager','products',1);
INSERT INTO role_permissions VALUES(13,'manager','about',0);
INSERT INTO role_permissions VALUES(14,'manager','settings',0);
INSERT INTO role_permissions VALUES(15,'viewer','dashboard',0);
INSERT INTO role_permissions VALUES(16,'viewer','production',0);
INSERT INTO role_permissions VALUES(17,'viewer','sales',1);
INSERT INTO role_permissions VALUES(18,'viewer','sales-return',0);
INSERT INTO role_permissions VALUES(19,'viewer','products',0);
INSERT INTO role_permissions VALUES(20,'viewer','about',0);
INSERT INTO role_permissions VALUES(21,'viewer','settings',0);
INSERT INTO role_permissions VALUES(42,'admin','home',1);
INSERT INTO role_permissions VALUES(43,'manager','home',1);
INSERT INTO role_permissions VALUES(44,'viewer','home',1);
INSERT INTO role_permissions VALUES(56,'admin','expiry',1);
INSERT INTO role_permissions VALUES(58,'manager','expiry',1);
INSERT INTO role_permissions VALUES(60,'viewer','expiry',0);
CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
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
    );
DELETE FROM sqlite_sequence;
INSERT INTO sqlite_sequence VALUES('users',7);
INSERT INTO sqlite_sequence VALUES('role_permissions',808);
INSERT INTO sqlite_sequence VALUES('password_reset_tokens',1);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_sku ON products(sku_code);
CREATE INDEX idx_batches_product_date ON batches(product_id, date);
CREATE INDEX idx_batches_date ON batches(date);
CREATE INDEX idx_batches_batch_number ON batches(batch_number);
CREATE INDEX idx_daily_metrics_batch ON daily_metrics(batch_id);
CREATE INDEX idx_expired_stock_product ON expired_stock(product_id);
CREATE INDEX idx_expired_stock_batch ON expired_stock(batch_number);
COMMIT;
