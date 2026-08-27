import fs from "node:fs"
import path from "node:path"

const ROOTS = ["app", "components"]
const EXCLUDE_DIRS = new Set(["node_modules", ".next"])

// Ordered: specific multi-class phrases FIRST, generic single-token sweep LAST.
const REPLACEMENTS = [
  // Positive/negative stock status badges — green + slate accents
  [
    'border-neutral-300 text-black font-bold text-[10px]">IN STOCK',
    'border-emerald-200 bg-emerald-50 text-emerald-700 font-bold text-[10px]">IN STOCK',
  ],
  [
    'border-neutral-300 text-neutral-400 font-bold text-[10px]">ZERO STOCK',
    'border-slate-200 bg-slate-50 text-slate-400 font-bold text-[10px]">ZERO STOCK',
  ],

  // Primary action buttons (Add/Edit/Save triggers) — solid Gaia blue
  [
    "bg-white text-black border border-neutral-300 hover:bg-neutral-100",
    "bg-gradient-to-br from-[#4A6FA5] to-[#3E5FA0] text-white border border-transparent hover:brightness-110",
  ],

  // SKU / batch code badges — blue tint
  [
    "border-neutral-300 text-black font-mono",
    "border-blue-200 bg-blue-50/60 text-[#2B4C86] font-mono",
  ],

  // Table header rows (main + nested batch breakdown)
  [
    "bg-neutral-100 text-black text-xs uppercase font-bold tracking-wider border-b border-neutral-200",
    "bg-gradient-to-r from-blue-50 to-slate-50 text-[#2B4C86] text-xs uppercase font-bold tracking-wider border-b border-blue-100",
  ],
  [
    "bg-neutral-100 text-black font-bold uppercase tracking-wider border-b border-neutral-200",
    "bg-gradient-to-r from-blue-50 to-slate-50 text-[#2B4C86] font-bold uppercase tracking-wider border-b border-blue-100",
  ],

  // Row hover states
  [
    "hover:bg-neutral-50 transition-colors cursor-pointer select-none",
    "hover:bg-blue-50/60 transition-colors cursor-pointer select-none",
  ],
  [
    "hover:bg-neutral-50 transition-colors",
    "hover:bg-blue-50/60 transition-colors",
  ],

  // Generic atomic sweep (order-independent, applied last)
  ["text-black", "text-slate-800"],
  ["border-neutral-200", "border-blue-100"],
  ["border-neutral-300", "border-blue-200"],
  ["bg-neutral-100", "bg-blue-50"],
  ["bg-neutral-50", "bg-slate-50"],
  ["text-neutral-600", "text-slate-500"],
  ["text-neutral-500", "text-slate-400"],
  ["text-neutral-700", "text-slate-600"],
  ["divide-neutral-200", "divide-blue-100"],
]

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (EXCLUDE_DIRS.has(entry.name)) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, files)
    else if (entry.isFile() && entry.name.endsWith(".tsx")) files.push(full)
  }
  return files
}

let changedCount = 0
for (const root of ROOTS) {
  if (!fs.existsSync(root)) continue
  for (const file of walk(root)) {
    let content = fs.readFileSync(file, "utf8")
    const original = content
    for (const [oldStr, newStr] of REPLACEMENTS) {
      content = content.split(oldStr).join(newStr)
    }
    if (content !== original) {
      fs.writeFileSync(file, content, "utf8")
      console.log(`UPDATED: ${file}`)
      changedCount++
    }
  }
}
console.log(`\nDone. ${changedCount} file(s) updated. Review with: git diff --stat`)
