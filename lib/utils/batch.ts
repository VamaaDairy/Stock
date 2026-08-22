/**
 * Tally Dairy Batch Code Generator
 * Formula: [Plant Code 'A'][Month Letter A-L][Day 01-31][SKU Code or Product Abbr]
 * Examples:
 * - AA19HIM  => Plant A, Jan (A), 19th day, HIM
 * - AH221003 => Plant A, Aug (H), 22nd day, SKU 1003
 */
export function generateDairyBatchCode(
  dateStr: string,
  skuCode?: string,
  category?: string,
  productName?: string
): string {
  const d = dateStr ? new Date(dateStr) : new Date()
  const day = String(d.getDate()).padStart(2, "0")
  
  // Month letter (1 = A, 2 = B, ..., 8 = H, 12 = L)
  const monthLetters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"]
  const monthLetter = monthLetters[d.getMonth()] || "H"
  
  const plantCode = "A"
  
  let prodCode = "101"
  if (skuCode && skuCode.trim()) {
    prodCode = skuCode.trim()
  } else if (productName) {
    const words = productName.split(" ").filter(Boolean)
    if (words.length >= 2) {
      prodCode = words.map(w => w[0].toUpperCase()).join("").slice(0, 4)
    } else {
      prodCode = productName.slice(0, 3).toUpperCase()
    }
  } else if (category) {
    prodCode = category.slice(0, 3).toUpperCase()
  }

  return `${plantCode}${monthLetter}${day}${prodCode}`
}
