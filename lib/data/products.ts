export interface Product {
  id: string
  name: string
  skuCode: string
  category: string
  unit: string
  pcsPerCrt: number
  shelfLifeDays?: number
}

export const products: Product[] = [
  // Milk (Fresh Milk)
  { id: "1", name: "Gaia Doodh Toned 500ml- Pkt", skuCode: "1003", category: "Milk", unit: "CRT", pcsPerCrt: 24, shelfLifeDays: 2 },
  { id: "2", name: "Gaia Cow Milk 500 ML (Crt)", skuCode: "999", category: "Milk", unit: "CRT", pcsPerCrt: 24, shelfLifeDays: 2 },

  // UHT Milk (Dedicated Category)
  { id: "3", name: "Gaia Maxx UHT 110ml", skuCode: "1042", category: "UHT Milk", unit: "CBX", pcsPerCrt: 40, shelfLifeDays: 90 },
  { id: "4", name: "Gaia Maxx UHT 400ml", skuCode: "1045", category: "UHT Milk", unit: "CBX", pcsPerCrt: 20, shelfLifeDays: 90 },
  { id: "5", name: "Gaia Premium Milk UHT Tetra Pack 1 Ltr", skuCode: "1050", category: "UHT Milk", unit: "CBX", pcsPerCrt: 12, shelfLifeDays: 180 },
  { id: "6", name: "Gaia Lite Milk UHT Tetra Pack 1Ltr", skuCode: "1051", category: "UHT Milk", unit: "CBX", pcsPerCrt: 12, shelfLifeDays: 180 },
  { id: "7", name: "Gaia Gold Milk UHT Tetra Pack 1Ltr", skuCode: "1052", category: "UHT Milk", unit: "CBX", pcsPerCrt: 12, shelfLifeDays: 180 },

  // Dahi
  { id: "8", name: "Gaia Dahi (Crt) 200 Gms 60 Pkt", skuCode: "1012", category: "Dahi", unit: "CRT", pcsPerCrt: 60, shelfLifeDays: 17 },
  { id: "9", name: "Gaia Dahi 400 Gms (Crt) 30 Pkt", skuCode: "1013", category: "Dahi", unit: "CRT", pcsPerCrt: 30, shelfLifeDays: 17 },
  { id: "10", name: "Gaia Dahi 1 Kg- 12 Packets", skuCode: "1014", category: "Dahi", unit: "CRT", pcsPerCrt: 12, shelfLifeDays: 17 },
  { id: "11", name: "Gaia Dahi 5kg Pouch (2pcs)", skuCode: "1015", category: "Dahi", unit: "CRT", pcsPerCrt: 2, shelfLifeDays: 17 },
  { id: "12", name: "Gaia Dahi  Bucket 5 Kg", skuCode: "1047", category: "Dahi", unit: "PCS", pcsPerCrt: 1, shelfLifeDays: 17 },
  { id: "13", name: "Gaia Dahi  Bucket 15 Kg", skuCode: "1016", category: "Dahi", unit: "PCS", pcsPerCrt: 1, shelfLifeDays: 17 },
  { id: "14", name: "Gaia Dahi Cup 200 Gms Box(6Pc)", skuCode: "1056", category: "Dahi", unit: "CBX", pcsPerCrt: 6, shelfLifeDays: 17 },
  { id: "15", name: "Gaia Dahi (Cup) 200 Gms", skuCode: "1011", category: "Dahi", unit: "CBX", pcsPerCrt: 30, shelfLifeDays: 17 },
  { id: "16", name: "Gaia Mishti Doi 80g", skuCode: "1010", category: "Dahi", unit: "CBX", pcsPerCrt: 12, shelfLifeDays: 5 },
  { id: "17", name: "Gaia Premium Sweet Dahi (Lychee) Cup 90 Gms", skuCode: "1026", category: "Dahi", unit: "CBX", pcsPerCrt: 12, shelfLifeDays: 7 },
  { id: "18", name: "Gaia Premium Sweet Dahi (Muskmelon) Cup 90 Gms  O", skuCode: "1027", category: "Dahi", unit: "PCS", pcsPerCrt: 1, shelfLifeDays: 7 },

  // Kadhi Dahi
  { id: "19", name: "Gaia Kadhi Dahi (Crt) 200 Gm 60 Pkt", skuCode: "1020", category: "Kadhi Dahi", unit: "CRT", pcsPerCrt: 60, shelfLifeDays: 17 },
  { id: "20", name: "Gaia Kadhi Dahi 1 Kg Crt (12 Pcs)", skuCode: "1019", category: "Kadhi Dahi", unit: "CRT", pcsPerCrt: 12, shelfLifeDays: 17 },
  { id: "21", name: "Gaia Kadhi Dahi 5kg Pouch (2 Pcs)", skuCode: "1021", category: "Kadhi Dahi", unit: "CRT", pcsPerCrt: 2, shelfLifeDays: 17 },
  { id: "22", name: "Gaia Kadhi Dahi Bucket 1.5 KG", skuCode: "1018", category: "Kadhi Dahi", unit: "PCS", pcsPerCrt: 1, shelfLifeDays: 17 },
  { id: "23", name: "Gaia Kadhi Dahi Bucket 15 Kg", skuCode: "1022", category: "Kadhi Dahi", unit: "PCS", pcsPerCrt: 1, shelfLifeDays: 17 },

  // Lassi & Chaas
  { id: "24", name: "Gaia Plain Lassi 180 Ml (Glass Cup 10)", skuCode: "1023", category: "Lassi", unit: "CBX", pcsPerCrt: 10, shelfLifeDays: 12 },
  { id: "25", name: "Mango Lassi 180 Ml - 10Pcs", skuCode: "1024", category: "Lassi", unit: "CBX", pcsPerCrt: 10, shelfLifeDays: 12 },
  { id: "26", name: "Gaia Masala Chaas 180 ML Glass", skuCode: "1046", category: "Lassi", unit: "CBX", pcsPerCrt: 10, shelfLifeDays: 12 },
  { id: "27", name: "Gaia Sweet Lassi 180ml Pouch", skuCode: "1028", category: "Lassi", unit: "CRT", pcsPerCrt: 24, shelfLifeDays: 3 },
  { id: "28", name: "Strawberry Lassi 180 Ml - 10 Pcs", skuCode: "1049", category: "Lassi", unit: "CBX", pcsPerCrt: 10, shelfLifeDays: 3 },

  // Paneer
  { id: "29", name: "Gaia Paneer 200gms", skuCode: "1005", category: "Paneer", unit: "PCS", pcsPerCrt: 1, shelfLifeDays: 18 },
  { id: "30", name: "Gaia Paneer 500Gms", skuCode: "1006", category: "Paneer", unit: "PCS", pcsPerCrt: 1, shelfLifeDays: 18 },
  { id: "31", name: "Gaia Paneer 1kg", skuCode: "1007", category: "Paneer", unit: "PCS", pcsPerCrt: 1, shelfLifeDays: 18 },
  { id: "32", name: "Loose 1 Kg", skuCode: "1008", category: "Paneer", unit: "PCS", pcsPerCrt: 1, shelfLifeDays: 5 },
  { id: "33", name: "Loose 5 Kg", skuCode: "1009", category: "Paneer", unit: "PCS", pcsPerCrt: 1, shelfLifeDays: 5 },

  // Ghee
  { id: "34", name: "Gaia Premium Desi Ghee 20ml", skuCode: "1055", category: "Ghee", unit: "CBX", pcsPerCrt: 100, shelfLifeDays: 240 },
  { id: "35", name: "Gaia Ghee 200 ML Jar", skuCode: "1029", category: "Ghee", unit: "CBX", pcsPerCrt: 24, shelfLifeDays: 240 },
  { id: "36", name: "Gaia Ghee 500 ML Jar", skuCode: "1030", category: "Ghee", unit: "CBX", pcsPerCrt: 12, shelfLifeDays: 240 },
  { id: "37", name: "Gaia  Ghee 1 Ltr Jar 18", skuCode: "1031", category: "Ghee", unit: "CBX", pcsPerCrt: 12, shelfLifeDays: 240 },
  { id: "38", name: "Gaia Ghee Ceka Pack 1ltr", skuCode: "1038", category: "Ghee", unit: "CBX", pcsPerCrt: 12, shelfLifeDays: 240 },
  { id: "39", name: "Gaia Premium Desi Ghee Ceka Pack 900ml", skuCode: "1053", category: "Ghee", unit: "CBX", pcsPerCrt: 12, shelfLifeDays: 240 },
  { id: "40", name: "Gaia Ghee 5 Ltr.Jar", skuCode: "1032", category: "Ghee", unit: "CBX", pcsPerCrt: 4, shelfLifeDays: 240 },
  { id: "41", name: "Gaia Cow Ghee 200 Ml Jar", skuCode: "1039", category: "Ghee", unit: "CBX", pcsPerCrt: 24, shelfLifeDays: 240 },
  { id: "42", name: "Gaia Cow Ghee 500 Ml Jar", skuCode: "1040", category: "Ghee", unit: "CBX", pcsPerCrt: 12, shelfLifeDays: 240 },
  { id: "43", name: "Gaia Cow Ghee 1Ltr Jar", skuCode: "1041", category: "Ghee", unit: "CBX", pcsPerCrt: 12, shelfLifeDays: 240 },
  { id: "44", name: "Gaia Pure Cow Ghee Ceka Pack 900ml", skuCode: "1054", category: "Ghee", unit: "CBX", pcsPerCrt: 12, shelfLifeDays: 240 },
  { id: "45", name: "Gaia Cow Ghee Ceka Pack 1ltr", skuCode: "1037", category: "Ghee", unit: "CBX", pcsPerCrt: 12, shelfLifeDays: 240 },
  { id: "46", name: "Gaia Ghee 15 Kilogram", skuCode: "1033", category: "Ghee", unit: "PCS", pcsPerCrt: 1, shelfLifeDays: 240 },

  // Rabdi & Shrikhand
  { id: "47", name: "Gaia Shahi Rabdi 80g  (1cup*12pcs)", skuCode: "1048", category: "Rabdi", unit: "CBX", pcsPerCrt: 12, shelfLifeDays: 12 },
  { id: "48", name: "Gaia Shrikhand KE 80g", skuCode: "1043", category: "Shrikhand", unit: "CBX", pcsPerCrt: 12, shelfLifeDays: 30 },
  { id: "49", name: "Gaia Shrikhand KE 80g-Box (6Pc)", skuCode: "1044", category: "Shrikhand", unit: "CBX", pcsPerCrt: 6, shelfLifeDays: 7 },

  // Peda & Khowa
  { id: "50", name: "Gaia Peda 200 Gm Pcs", skuCode: "1034", category: "Peda", unit: "CBX", pcsPerCrt: 20, shelfLifeDays: 40 },
  { id: "51", name: "Gaia Kesar Peda 200 Gm Pcs", skuCode: "1035", category: "Peda", unit: "CBX", pcsPerCrt: 20, shelfLifeDays: 40 },
  { id: "52", name: "Khowa White ( Unsweetened )", skuCode: "1058", category: "Khowa", unit: "KG", pcsPerCrt: 1, shelfLifeDays: 5 },
  { id: "53", name: "Khowa Brown ( Unsweetened )", skuCode: "1059", category: "Khowa", unit: "KG", pcsPerCrt: 1, shelfLifeDays: 5 },
]
