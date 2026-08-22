"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function daysAgoStr(days: number) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

function firstDayOfMonthStr() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10)
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
  const [mode, setMode] = useState<"single" | "range">(value.mode || "single")

  const handleModeChange = (newMode: "single" | "range") => {
    setMode(newMode)
    if (newMode === "single") {
      onChange({ ...value, mode: "single", date: value.date || todayStr() })
    } else {
      onChange({
        ...value,
        mode: "range",
        fromDate: value.fromDate || daysAgoStr(7),
        toDate: value.toDate || todayStr(),
      })
    }
  }

  const handlePreset = (preset: "today" | "yesterday" | "last7" | "month") => {
    const today = todayStr()
    if (preset === "today") {
      setMode("single")
      onChange({ mode: "single", date: today, fromDate: today, toDate: today })
    } else if (preset === "yesterday") {
      const yest = daysAgoStr(1)
      setMode("single")
      onChange({ mode: "single", date: yest, fromDate: yest, toDate: yest })
    } else if (preset === "last7") {
      const from = daysAgoStr(7)
      setMode("range")
      onChange({ mode: "range", date: today, fromDate: from, toDate: today })
    } else if (preset === "month") {
      const from = firstDayOfMonthStr()
      setMode("range")
      onChange({ mode: "range", date: today, fromDate: from, toDate: today })
    }
  }

  return (
    <div className="bg-white p-3 rounded-xl border border-neutral-200 space-y-2 text-black shadow-xs">
      {/* Mode & Preset Buttons */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1 rounded-lg p-0.5 bg-neutral-100">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleModeChange("single")}
            className={`h-7 text-xs font-bold px-2.5 rounded-md ${
              mode === "single" ? "bg-white text-black border border-neutral-300 shadow-xs" : "text-neutral-700 hover:bg-neutral-200 border-none"
            }`}
          >
            Single Date
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleModeChange("range")}
            className={`h-7 text-xs font-bold px-2.5 rounded-md ${
              mode === "range" ? "bg-white text-black border border-neutral-300 shadow-xs" : "text-neutral-700 hover:bg-neutral-200 border-none"
            }`}
          >
            Date Range (Period)
          </Button>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-1 flex-wrap">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handlePreset("today")}
            className="h-7 text-[11px] font-bold px-2 bg-neutral-100 text-black hover:bg-neutral-200 border-none"
          >
            Today
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handlePreset("yesterday")}
            className="h-7 text-[11px] font-bold px-2 bg-neutral-100 text-black hover:bg-neutral-200 border-none"
          >
            Yesterday
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handlePreset("last7")}
            className="h-7 text-[11px] font-bold px-2 bg-neutral-100 text-black hover:bg-neutral-200 border-none"
          >
            Last 7 Days
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handlePreset("month")}
            className="h-7 text-[11px] font-bold px-2 bg-neutral-100 text-black hover:bg-neutral-200 border-none"
          >
            This Month
          </Button>
        </div>
      </div>

      {/* Date Pickers */}
      {mode === "single" ? (
        <div className="flex items-center gap-2">
          <Label className="text-xs font-bold text-neutral-600 uppercase">Date:</Label>
          <Input
            type="date"
            className="h-9 text-sm w-44 font-semibold border-neutral-300 text-black bg-white"
            value={value.date}
            onChange={e => onChange({ ...value, mode: "single", date: e.target.value })}
          />
        </div>
      ) : (
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Label className="text-xs font-bold text-neutral-600 uppercase">From:</Label>
            <Input
              type="date"
              className="h-9 text-sm w-36 font-semibold border-neutral-300 text-black bg-white"
              value={value.fromDate}
              onChange={e => onChange({ ...value, mode: "range", fromDate: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-1.5">
            <Label className="text-xs font-bold text-neutral-600 uppercase">To:</Label>
            <Input
              type="date"
              className="h-9 text-sm w-36 font-semibold border-neutral-300 text-black bg-white"
              value={value.toDate}
              onChange={e => onChange({ ...value, mode: "range", toDate: e.target.value })}
            />
          </div>
        </div>
      )}
    </div>
  )
}
