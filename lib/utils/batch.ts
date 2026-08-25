/**
 * Vamaa Dairy Batch Code Generator
 *
 * Format: [Plant Code][Product Code][Day 01-31][Month Letter A-L][Year Letter][Size Code]
 *
 * Plant Code:  A = Vamaa Dairy Pvt. Ltd.
 * Product Code: A=Plain Dahi, B=Kadi Dahi, C=Lychee Dahi, D=Muskmelon Dahi,
 *               E=Masala Chaas, F=Misti Doi, G=Shrikhand, H=Lassi Plain,
 *               I=Mango Lassi, J=Strawberry Lassi, K=Paneer, L=Desi Ghee,
 *               M=Cow Ghee, N=Malai Peda, O=Kesar Peda, P=Khoa,
 *               Q=DTM (Desi Toned Milk), R=TM (Toned Milk), S=CM (Cow Milk),
 *               T=SM (UHT Standardized Milk), U=FCM, V=Rabdi
 * Month:       A=Jan, B=Feb, C=Mar, D=Apr, E=May, F=Jun,
 *              G=Jul, H=Aug, I=Sep, J=Oct, K=Nov, L=Dec
 * Year:        A=2018, B=2019, C=2020, D=2021, E=2022, F=2023, G=2024, H=2025, I=2026, J=2027...
 * Size Code (ML): 100ml=I, 180ml=A, 200ml=B, 500ml=C, 1000ml=D, 5L=E, 15L=F, 90ml=G, 900ml=H, 20ml=?
 * Size Code (GM): 180g=J, 200g=K, 400g=L, 500g=M, 1kg=N, 5kg=O, 15kg=P, 80g=Q, 40kg=Z
 *
 * Example: AA02EIO = Plant A, Plain Dahi (A), Day 02, May (E), 2026 (I), 15kg (P)
 *          AR02EID = Plant A, TM (R), Day 02, May (E), 2026 (I), 1000ml (D)
 */

// Product code lookup: product ID → single letter code
const PRODUCT_CODE_BY_ID: Record<string, string> = {
  // Milk
  "1": "R",   // Gaia Toned Milk 500ml → TM = R
  "2": "S",   // Gaia Cow Milk 500ml → CM = S

  // UHT Milk
  "3": "T",   // Gaia Maxx UHT Milk 110ml → SM (UHT) = T
  "4": "T",   // Gaia Maxx UHT Milk 400ml → SM (UHT) = T
  "5": "T",   // Gaia Premium Milk UHT 1L → SM (UHT) = T
  "6": "T",   // Gaia Lite Milk UHT 1L
  "7": "U",   // Gaia Gold Milk UHT 1L → FCM = U

  // Dahi (Plain Dahi = A)
  "8": "A",   // GAIA DAHI POUCH 200g
  "9": "A",   // GAIA DAHI POUCH 400g
  "10": "A",  // GAIA DAHI POUCH 1kg
  "11": "A",  // GAIA DAHI POUCH 5kg
  "12": "A",  // GAIA DAHI BUCKET 5kg
  "13": "A",  // GAIA DAHI BUCKET 15kg
  "14": "A",  // Gaia Dahi Cup 200g Box 6Pc
  "15": "A",  // Gaia Dahi Cup 200g Box 30Pc
  "16": "F",  // Gaia Mishri Dahi 80g → Misti Doi = F
  "17": "C",  // Gaia Premium Sweet Dahi Lychee 90g → C
  "18": "D",  // Gaia Premium Sweet Dahi Muskmelon 90g → D

  // Kadhi Dahi (Kadi Dahi = B)
  "19": "B",  // GAIA KADHI DAHI POUCH 200g
  "20": "B",  // GAIA KADHI DAHI POUCH 1kg
  "21": "B",  // GAIA KADHI DAHI POUCH 5kg
  "22": "B",  // GAIA KADHI DAHI BUCKET 1.5kg
  "23": "B",  // GAIA KADHI DAHI BUCKET 15kg

  // Lassi & Chaas
  "24": "H",  // GAIA LASSI GLASS 180ml → Glass Lassi Plain = H
  "25": "I",  // GAIA MANGO LASSI 180ml → Glass Mango Lassi = I
  "26": "E",  // GAIA MASALA CHAAS 180ml → Glass Masala Chaas = E
  "27": "H",  // Gaia Sweet Lassi 180ml Pouch → H
  "28": "J",  // Strawberry Lassi 180ml → J

  // Paneer (Gaia Malai Paneer = K)
  "29": "K",  // Gaia Paneer 200g
  "30": "K",  // Gaia Paneer 500g
  "31": "K",  // Gaia Paneer 1kg
  "32": "K",  // Loose Paneer 1kg
  "33": "K",  // Loose Paneer 5kg

  // Ghee - Desi (L) / Cow (M)
  "34": "L",  // Gaia Premium Desi Ghee 20ml
  "35": "L",  // Gaia Premium Desi Ghee 200ml JAR
  "36": "L",  // Gaia Premium Desi Ghee 500ml JAR
  "37": "L",  // Gaia Premium Desi Ghee 1L JAR
  "38": "L",  // Gaia Premium Desi Ghee 5L JAR
  "39": "L",  // GAIA GHEE CEKA 1L
  "40": "M",  // Gaia Cow Ghee 200ml JAR
  "41": "M",  // Gaia Cow Ghee 500ml JAR
  "42": "M",  // GAIA COW GHEE JAR 1L
  "43": "M",  // GAIA COW GHEE CEKA 1L
  "44": "L",  // GAIA PREMIUM GHEE TIN 15kg
  "45": "L",  // Gaia Premium Desi Ghee CEKA 900ml
  "46": "M",  // Gaia Pure Cow Ghee CEKA 900ml

  // Rabdi & Shrikhand
  "47": "V",  // GAIA SHAHI RABDI TRAY → Rabdi = V
  "48": "V",  // Gaia Shahi Rabdi 80g Box 6Pc
  "49": "V",  // Gaia Shahi Rabdi 80g 12Pc
  "50": "G",  // Gaia Shrikhand 80g → Shri Khand = G
  "51": "G",  // Gaia Shrikhand 80g Box 6Pc

  // Peda & Khowa
  "52": "N",  // Gaia Milk Peda 200g → Malai Peda = N
  "53": "P",  // GAIA BROWN KHOWA → Khoa = P
}

// Size code lookup by product ID (based on pack size)
const SIZE_CODE_BY_ID: Record<string, string> = {
  // Milk (500ml = C)
  "1": "C",   // 500ml
  "2": "C",   // 500ml

  // UHT Milk
  "3": "I",   // 110ml → closest is 100ml = I
  "4": "B",   // 400ml → 200ml=B? Actually no exact match; use K (400g equivalent)
  "5": "D",   // 1L → 1000ml = D
  "6": "D",   // 1L
  "7": "D",   // 1L

  // Dahi
  "8": "K",   // 200g → K
  "9": "L",   // 400g → L
  "10": "N",  // 1kg → N
  "11": "O",  // 5kg → O
  "12": "O",  // 5kg → O
  "13": "P",  // 15kg → P
  "14": "K",  // 200g → K
  "15": "K",  // 200g → K
  "16": "Q",  // 80g → Q
  "17": "G",  // 90g → closest is G (90ml/gm)
  "18": "G",  // 90g → G

  // Kadhi Dahi
  "19": "K",  // 200g → K
  "20": "N",  // 1kg → N
  "21": "O",  // 5kg → O
  "22": "M",  // 1.5kg → closest is M (500g) — no exact; use M
  "23": "P",  // 15kg → P

  // Lassi & Chaas (180ml = A)
  "24": "A",  // 180ml → A
  "25": "A",  // 180ml → A
  "26": "A",  // 180ml → A
  "27": "A",  // 180ml → A
  "28": "A",  // 180ml → A

  // Paneer
  "29": "K",  // 200g → K
  "30": "M",  // 500g → M
  "31": "N",  // 1kg → N
  "32": "N",  // 1kg → N
  "33": "O",  // 5kg → O

  // Ghee - Desi
  "34": "B",  // 20ml → no exact; use B (200ml) or custom - use B
  "35": "K",  // 200ml JAR → K (200gm equivalent)
  "36": "C",  // 500ml JAR → C
  "37": "D",  // 1L → D
  "38": "E",  // 5L → E
  "39": "D",  // 1L CEKA → D
  "40": "K",  // 200ml → K
  "41": "C",  // 500ml → C
  "42": "D",  // 1L → D
  "43": "D",  // 1L CEKA → D
  "44": "P",  // 15kg TIN → P
  "45": "H",  // 900ml → H
  "46": "H",  // 900ml → H

  // Rabdi & Shrikhand (80g = Q)
  "47": "Q",  // 80g → Q
  "48": "Q",  // 80g → Q
  "49": "Q",  // 80g → Q
  "50": "Q",  // 80g → Q
  "51": "Q",  // 80g → Q

  // Peda & Khowa
  "52": "K",  // 200g → K
  "53": "N",  // 1kg → N
}

const MONTH_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"]
const BASE_YEAR = 2018 // A = 2018, B = 2019, ..., I = 2026

/**
 * Generate Vamaa Dairy batch code
 * @param dateStr        - ISO date string YYYY-MM-DD (manufacturing date)
 * @param productId      - Product ID (from products list)
 */
export function generateDairyBatchCode(
  dateStr: string,
  productId: string,
): string {
  const d = dateStr ? new Date(dateStr) : new Date()

  const plantCode = "A"
  const productCode = PRODUCT_CODE_BY_ID[productId] ?? "A"
  const sizeCode = SIZE_CODE_BY_ID[productId] ?? "A"

  const day = String(d.getDate()).padStart(2, "0")
  const monthLetter = MONTH_LETTERS[d.getMonth()] ?? "A"
  const yearLetter = String.fromCharCode(65 + (d.getFullYear() - BASE_YEAR))

  // Format: [Plant][Product][Day][Month][Year][Size]
  return `${plantCode}${productCode}${day}${monthLetter}${yearLetter}${sizeCode}`
}
