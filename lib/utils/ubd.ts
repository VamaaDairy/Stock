/**
 * UBD (Use Before Date) Shelf Life Utilities
 * UBD % = (Days remaining until UBD / Shelf Life Days) × 100
 */

export function calcUBDPercent(
  ubd: string | null | undefined,
  shelfLifeDays: number | null | undefined
): number | null {
  if (!ubd || !shelfLifeDays || shelfLifeDays <= 0) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const ubdDate = new Date(ubd)
  ubdDate.setHours(0, 0, 0, 0)
  const rawDaysLeft = Math.round((ubdDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  const daysLeft = rawDaysLeft - 1
  const adjustedTotalDays = shelfLifeDays > 1 ? shelfLifeDays - 1 : shelfLifeDays
  return Math.round((daysLeft / adjustedTotalDays) * 1000) / 10 // 1 decimal place
}

export function formatUBDPercent(pct: number | null): string {
  if (pct === null) return "—"
  if (pct <= 0) return "EXPIRED"
  return `${pct.toFixed(1)}%`
}
