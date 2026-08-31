/**
 * Utility for exporting formatted data to Excel (CSV with UTF-8 BOM)
 * Opens cleanly in Microsoft Excel, Google Sheets, Apple Numbers, and LibreOffice.
 */

function escapeCsvValue(val: unknown): string {
  if (val === null || val === undefined) return '""'
  const str = String(val)
  // If the value contains quotes, commas, newlines or carriage returns, wrap in quotes and escape quotes
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return `"${str}"`
}

export interface ExcelExportOptions {
  filename: string
  sheetTitle?: string
  dateRangeText?: string
  headers: string[]
  rows: (string | number | null | undefined)[][]
}

export function exportToExcel({
  filename,
  sheetTitle,
  dateRangeText,
  headers,
  rows,
}: ExcelExportOptions) {
  const lines: string[] = []

  // Add metadata headers if provided
  if (sheetTitle) {
    lines.push(`"VAMAA DAIRY - ${sheetTitle}"`)
  }
  if (dateRangeText) {
    lines.push(`"Period: ${dateRangeText}"`)
  }
  if (sheetTitle || dateRangeText) {
    lines.push(`"Exported At: ${new Date().toLocaleString('en-IN')}"`)
    lines.push('""') // blank line
  }

  // Column Headers
  lines.push(headers.map(escapeCsvValue).join(','))

  // Data rows
  for (const row of rows) {
    lines.push(row.map(escapeCsvValue).join(','))
  }

  // Prepend UTF-8 Byte Order Mark (BOM) so Excel respects UTF-8 encoding
  const csvContent = '\uFEFF' + lines.join('\r\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })

  const cleanFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', cleanFilename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
