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
  const total = Number(totalQty ?? 0)
  const factor = Math.max(1, Math.round(Number(pcsPerCrt) || 1))

  if (factor <= 1) {
    const u = outerUnit === "CRT" || outerUnit === "CBX" ? "PCS" : (outerUnit || innerUnit || "PCS")
    const formattedVal = Math.round(total * 100) / 100
    return `${formattedVal.toLocaleString()} ${u}`
  }

  if (total === 0) {
    return `0 ${outerUnit}`
  }

  const roundedTotal = Math.round(total)
  const crt = Math.floor(roundedTotal / factor)
  const pc = roundedTotal % factor

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

export interface StructuredQty {
  crt: number
  pc: number
  total: number
  unit: string
  crtUnit: string
  pcUnit: string
  display: string
}

/**
 * Build standard quantity object with attached unit metadata
 */
export function buildQtyWithUnits(
  crt: number = 0,
  pc: number = 0,
  total: number = 0,
  unit: string = "CRT",
  pcsPerCrt: number = 1,
  packLabel?: string
): StructuredQty {
  const normUnit = (unit || "CRT").toUpperCase().trim()
  const factor = Math.max(1, Math.round(Number(pcsPerCrt) || 1))
  const crtUnit = normUnit
  const pcUnit = factor > 1 ? "PCS" : normUnit
  
  let calcTotal = Number(total || 0)
  let calcCrt = Number(crt || 0)
  let calcPc = Number(pc || 0)

  // If total is provided and factor > 1, ensure clean integer crate and piece split
  if (calcTotal > 0 && factor > 1) {
    const roundedTotal = Math.round(calcTotal)
    calcCrt = Math.floor(roundedTotal / factor)
    calcPc = roundedTotal % factor
    calcTotal = roundedTotal
  } else if (calcCrt > 0 && factor > 1 && calcTotal === 0) {
    calcTotal = Math.round(calcCrt * factor + calcPc)
    calcCrt = Math.floor(calcTotal / factor)
    calcPc = calcTotal % factor
  }

  return {
    crt: calcCrt,
    pc: calcPc,
    total: calcTotal,
    unit: normUnit,
    crtUnit,
    pcUnit,
    display: formatMixedUnit(calcTotal, factor, crtUnit, pcUnit),
  }
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

  const rawDaysLeft = Math.round((ubdDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  // Both numerator (days left) and denominator (total shelf life) reduced by 1
  const daysLeft = rawDaysLeft - 1
  const adjustedTotalDays = totalDays > 1 ? totalDays - 1 : totalDays

  return Math.round((daysLeft / adjustedTotalDays) * 1000) / 10
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
