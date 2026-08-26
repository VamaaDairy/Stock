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
  "47": "V",  // GAIA SHAHI RABDI 80g → Rabdi = V
  "48": "G",  // Gaia Shrikhand KE 80g → Shrikhand = G
  "49": "G",  // Gaia Shrikhand KE 80g Box 6Pc → Shrikhand = G

  // Peda & Khowa
  "50": "N",  // Gaia Peda 200g → Malai Peda = N
  "51": "N",  // Gaia Kesar Peda 200g → Malai Peda = N
  "52": "P",  // Khowa White → Khoa = P
  "53": "P",  // Khowa Brown → Khoa = P
}

// Size code lookup by product ID (based on pack size from Excel sheet)
// 80g = Q, 180ml = A, 200g/ml = J, 400g = K, 500g/ml = L, 1kg/1L = M, 5kg/5L = N, 15kg = O
const SIZE_CODE_BY_ID: Record<string, string> = {
  // Milk
  "1": "L",   // 500ml → L
  "2": "L",   // 500ml → L

  // UHT Milk
  "3": "Q",   // 110ml → Q
  "4": "K",   // 400ml → K
  "5": "M",   // 1L → M
  "6": "M",   // 1L → M
  "7": "M",   // 1L → M

  // Dahi
  "8": "J",   // 200g → J
  "9": "K",   // 400g → K
  "10": "M",  // 1kg → M
  "11": "N",  // 5kg → N
  "12": "N",  // 5kg → N
  "13": "O",  // 15kg → O
  "14": "J",  // 200g → J
  "15": "J",  // 200g → J
  "16": "Q",  // 80g → Q
  "17": "Q",  // 90g → Q
  "18": "Q",  // 90g → Q

  // Kadhi Dahi
  "19": "J",  // 200g → J
  "20": "M",  // 1kg → M
  "21": "N",  // 5kg → N
  "22": "M",  // 1.5kg → M
  "23": "O",  // 15kg → O

  // Lassi & Chaas
  "24": "A",  // 180ml → A
  "25": "A",  // 180ml → A
  "26": "A",  // 180ml → A
  "27": "A",  // 180ml → A
  "28": "A",  // 180ml → A

  // Paneer
  "29": "J",  // 200g → J
  "30": "L",  // 500g → L
  "31": "M",  // 1kg → M
  "32": "M",  // 1kg → M
  "33": "N",  // 5kg → N

  // Ghee
  "34": "B",  // 20ml → B
  "35": "J",  // 200ml → J
  "36": "L",  // 500ml → L
  "37": "M",  // 1L → M
  "38": "M",  // 1L → M
  "39": "M",  // 900ml/1L → M
  "40": "N",  // 5L → N
  "41": "J",  // 200ml → J
  "42": "L",  // 500ml → L
  "43": "M",  // 1L → M
  "44": "M",  // 900ml → M
  "45": "M",  // 1L → M
  "46": "O",  // 15kg → O

  // Rabdi & Shrikhand
  "47": "Q",  // 80g → Q
  "48": "Q",  // 80g → Q
  "49": "Q",  // 80g → Q

  // Peda & Khowa
  "50": "J",  // 200g → J
  "51": "J",  // 200g → J
  "52": "M",  // 1kg → M
  "53": "M",  // 1kg → M
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

/**
 * Compute Expiry Date YYYY-MM-DD from Mfg date and shelf life in days
 */
export function computeExpiryDate(mfgDateStr: string, shelfLifeStr: string | number): string {
  if (!mfgDateStr) return ""
  const days = typeof shelfLifeStr === "number" ? shelfLifeStr : parseInt(String(shelfLifeStr), 10)
  if (isNaN(days) || days <= 0) return ""
  const d = new Date(mfgDateStr)
  if (isNaN(d.getTime())) return ""
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

