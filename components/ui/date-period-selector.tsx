"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export interface PeriodSelection {
  mode: "single" | "range"
  date: string
  fromDate: string
  toDate: string
}

export default function DatePeriodSelector({
  value,
  onChange,
}: {
  value: PeriodSelection
  onChange: (val: PeriodSelection) => void
}) {
  const fromVal = value.fromDate || value.date || todayStr()
  const toVal = value.toDate || value.date || todayStr()

  const handleFromChange = (newFrom: string) => {
    if (newFrom === toVal) {
      onChange({
        mode: "single",
        date: newFrom,
        fromDate: newFrom,
        toDate: newFrom,
      })
    } else {
      onChange({
        mode: "range",
        date: newFrom,
        fromDate: newFrom,
        toDate: toVal,
      })
    }
  }

  const handleToChange = (newTo: string) => {
    if (fromVal === newTo) {
      onChange({
        mode: "single",
        date: newTo,
        fromDate: newTo,
        toDate: newTo,
      })
    } else {
      onChange({
        mode: "range",
        date: fromVal,
        fromDate: fromVal,
        toDate: newTo,
      })
    }
  }

  return (
    <div className="bg-white p-3 rounded-xl border border-neutral-200 text-black shadow-xs flex items-center gap-4 flex-wrap">
      <div className="flex items-center gap-2">
        <Label className="text-xs font-black text-neutral-700 uppercase tracking-wider">From:</Label>
        <Input
          type="date"
          className="h-10 text-sm w-40 font-bold border-neutral-300 text-black bg-white focus:ring-1 focus:ring-black"
          value={fromVal}
          onChange={e => handleFromChange(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-2">
        <Label className="text-xs font-black text-neutral-700 uppercase tracking-wider">To:</Label>
        <Input
          type="date"
          className="h-10 text-sm w-40 font-bold border-neutral-300 text-black bg-white focus:ring-1 focus:ring-black"
          value={toVal}
          onChange={e => handleToChange(e.target.value)}
        />
      </div>
    </div>
  )
}
