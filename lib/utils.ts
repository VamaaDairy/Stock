import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format quantity in mixed units: e.g. 50 pcs (when 12 pcs/crt) -> "4 CRT 2 PCS"
 * If pcsPerCrt <= 1: "50 PCS" or "50 KG"
 * If 0: "0 CRT" or "0 PCS"
 */
export function formatMixedUnit(
  totalQty: number | null | undefined,
  pcsPerCrt: number = 1,
  outerUnit: string = "CRT",
  innerUnit: string = "PCS"
): string {
  const total = Math.round(Number(totalQty ?? 0) * 100) / 100
  const factor = Math.max(1, Math.round(Number(pcsPerCrt) || 1))

  if (factor <= 1) {
    const u = outerUnit === "CRT" || outerUnit === "CBX" ? "PCS" : (outerUnit || innerUnit || "PCS")
    return `${total.toLocaleString()} ${u}`
  }

  if (total === 0) {
    return `0 ${outerUnit}`
  }

  const crt = Math.floor(total / factor)
  const pc = Math.round((total % factor) * 100) / 100

  const parts: string[] = []
  if (crt > 0) {
    parts.push(`${crt} ${outerUnit}`)
  }
  if (pc > 0) {
    parts.push(`${pc} ${innerUnit}`)
  }

  if (parts.length === 0) {
    return `0 ${outerUnit}`
  }

  return parts.join(" ")
}

/**
 * Convert pieces to crates and remainder pieces
 */
export function pcsToMixed(totalPcs: number, pcsPerCrt: number = 1, outerUnit: string = "CRT"): { crt: number; pc: number; total: number; display: string } {
  const total = Number(totalPcs || 0)
  const factor = Math.max(1, Number(pcsPerCrt) || 1)
  const crt = factor > 1 ? Math.floor(total / factor) : 0
  const pc = factor > 1 ? (total % factor) : total
  return {
    crt,
    pc,
    total,
    display: formatMixedUnit(total, pcsPerCrt, outerUnit, "PCS"),
  }
}

/**
 * Calculate UBD % (Percentage of shelf life remaining)
 */
export function calcUBDPercent(
  ubd: string | null | undefined,
  shelfLifeDays: number | null | undefined,
  mfgDate?: string | null | undefined
): number | null {
  if (!ubd) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const ubdDate = new Date(ubd)
  ubdDate.setHours(0, 0, 0, 0)
  if (isNaN(ubdDate.getTime())) return null

  let totalDays = shelfLifeDays ? Number(shelfLifeDays) : null
  if (mfgDate) {
    const mfg = new Date(mfgDate)
    mfg.setHours(0, 0, 0, 0)
    if (!isNaN(mfg.getTime()) && ubdDate.getTime() > mfg.getTime()) {
      totalDays = Math.round((ubdDate.getTime() - mfg.getTime()) / (1000 * 60 * 60 * 24))
    }
  }

  if (!totalDays || totalDays <= 0) return null

  const daysLeft = Math.round((ubdDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  return Math.round((daysLeft / totalDays) * 1000) / 10
}

/**
 * Color styling for UBD % badge
 */
export function ubdPercentColor(pct: number | null): string {
  if (pct === null) return "text-neutral-400"
  if (pct <= 0) return "text-red-600 font-black"
  if (pct < 50) return "text-red-500 font-bold"
  if (pct < 70) return "text-orange-500 font-bold"
  if (pct < 85) return "text-yellow-600 font-bold"
  return "text-green-600 font-bold"
}
