import fs from "node:fs"
import path from "node:path"

const IMPORT_LINE = 'import { PageHeader } from "@/components/ui/page-header"'

function addImportIfMissing(content) {
  if (content.includes(IMPORT_LINE)) return content
  const lines = content.split("\n")
  let lastImportIdx = -1
  lines.forEach((line, i) => {
    if (line.startsWith("import ")) lastImportIdx = i
  })
  if (lastImportIdx === -1) return IMPORT_LINE + "\n" + content
  lines.splice(lastImportIdx + 1, 0, IMPORT_LINE)
  return lines.join("\n")
}

function patchFile(relPath, oldBlock, newBlock) {
  const filePath = path.resolve(process.cwd(), relPath)
  if (!fs.existsSync(filePath)) {
    console.warn(`SKIP (not found): ${relPath}`)
    return
  }
  let content = fs.readFileSync(filePath, "utf8")
  if (!content.includes(oldBlock)) {
    console.warn(`SKIP (pattern not found, maybe already patched): ${relPath}`)
    return
  }
  content = content.replace(oldBlock, newBlock)
  content = addImportIfMissing(content)
  fs.writeFileSync(filePath, content, "utf8")
  console.log(`PATCHED: ${relPath}`)
}

patchFile(
  "app/products/page.tsx",
  `        {/* Header & Add Product Modal */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-black flex items-center gap-2">
              <Package className="h-8 w-8" />
              Products Master Management
            </h1>
            <p className="text-xs text-neutral-600 mt-1">
              Add, update, or remove master products. All app views dynamically reference this list.
            </p>
          </div>
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <Badge variant="outline" className="border-neutral-300 text-black font-mono font-bold text-xs">
              Total: {products.length} Products
            </Badge>
            <ProductFormModal onSaved={fetchProducts} />
          </div>
        </div>`,
  `        {/* Header & Add Product Modal */}
        <PageHeader
          icon={Package}
          title="Products Master Management"
          subtitle="Add, update, or remove master products. All app views dynamically reference this list."
          actions={
            <div className="flex items-center gap-3 self-start sm:self-auto">
              <Badge variant="outline" className="border-neutral-300 text-black font-mono font-bold text-xs">
                Total: {products.length} Products
              </Badge>
              <ProductFormModal onSaved={fetchProducts} />
            </div>
          }
        />`
)

patchFile(
  "app/sales/page.tsx",
  `        {/* Header & Date Selector */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-black flex items-center gap-2">
              <Truck className="h-8 w-8" />
              Daily Sales Management (Dispatches)
            </h1>
            <p className="text-xs text-neutral-600 mt-1">
              Showing Sales Entries for Date: <span className="font-bold text-black">{currentDateLabel}</span>
            </p>
          </div>
          <div className="self-start lg:self-auto">
            <DatePeriodSelector value={period} onChange={setPeriod} />
          </div>
        </div>`,
  `        {/* Header & Date Selector */}
        <PageHeader
          icon={Truck}
          title="Daily Sales Management (Dispatches)"
          subtitle={<>Showing Sales Entries for Date: <span className="font-bold text-black">{currentDateLabel}</span></>}
          actions={<DatePeriodSelector value={period} onChange={setPeriod} />}
        />`
)

patchFile(
  "app/sales-return/page.tsx",
  `        {/* Header & Date Selector */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-black flex items-center gap-2">
              <RotateCcw className="h-8 w-8" />
              Sales Return Management
            </h1>
            <p className="text-xs text-neutral-600 mt-1">
              Showing Sales Return Entries for Date: <span className="font-bold text-black">{currentDateLabel}</span>
            </p>
          </div>
          <div className="self-start lg:self-auto">
            <DatePeriodSelector value={period} onChange={setPeriod} />
          </div>
        </div>`,
  `        {/* Header & Date Selector */}
        <PageHeader
          icon={RotateCcw}
          title="Sales Return Management"
          subtitle={<>Showing Sales Return Entries for Date: <span className="font-bold text-black">{currentDateLabel}</span></>}
          actions={<DatePeriodSelector value={period} onChange={setPeriod} />}
        />`
)

patchFile(
  "app/production/page.tsx",
  `        {/* Header & Date Selector */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-black flex items-center gap-2">
              <Factory className="h-8 w-8" />
              Daily Production Management
            </h1>
            <p className="text-xs text-neutral-600 mt-1">
              Showing Production Entries for Date: <span className="font-bold text-black">{currentDateLabel}</span>
            </p>
          </div>
          <div className="self-start lg:self-auto">
            <DatePeriodSelector value={period} onChange={setPeriod} />
          </div>
        </div>`,
  `        {/* Header & Date Selector */}
        <PageHeader
          icon={Factory}
          title="Daily Production Management"
          subtitle={<>Showing Production Entries for Date: <span className="font-bold text-black">{currentDateLabel}</span></>}
          actions={<DatePeriodSelector value={period} onChange={setPeriod} />}
        />`
)

patchFile(
  "app/demand/page.tsx",
  `        {/* Header & Date Selector */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-black flex items-center gap-2">
              <ShoppingCart className="h-8 w-8" />
              Daily Demand Management
            </h1>
            <p className="text-xs text-neutral-600 mt-1">
              Showing Demand Entries for Date: <span className="font-bold text-black">{currentDateLabel}</span>
            </p>
          </div>
          <div className="self-start lg:self-auto">
            <DatePeriodSelector value={period} onChange={setPeriod} />
          </div>
        </div>`,
  `        {/* Header & Date Selector */}
        <PageHeader
          icon={ShoppingCart}
          title="Daily Demand Management"
          subtitle={<>Showing Demand Entries for Date: <span className="font-bold text-black">{currentDateLabel}</span></>}
          actions={<DatePeriodSelector value={period} onChange={setPeriod} />}
        />`
)

patchFile(
  "components/dashboard/Dashboard.tsx",
  `        {/* Top Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-black flex items-center gap-2">
              <Package className="h-8 w-8" />
              Current Stock Inventory
            </h1>
            <p className="text-xs text-neutral-600 mt-1">
              All-time live balance — every unsold batch shown regardless of production date.
            </p>
          </div>
        </div>`,
  `        {/* Top Header */}
        <PageHeader
          icon={Package}
          title="Current Stock Inventory"
          subtitle="All-time live balance — every unsold batch shown regardless of production date."
        />`
)

console.log("\nDone. Review the diffs with: git diff")
