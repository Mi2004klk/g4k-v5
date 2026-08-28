"use client"

import * as React from "react"
import { format, isValid } from "date-fns"
import { AppIcon } from "./icon/AppIcon"
import { cn } from "../utils/cn"
import { Button } from "./button"
import { Calendar } from "./calendar"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "./popover"
import { useIsMobile } from "../hooks/use-mobile"

export interface DatePickerPreset {
  label: string
  value: any
}

export interface DatePickerProps {
  value?: any
  onChange?: (date: any) => void
  disabled?: any
  className?: string
  placeholder?: string
  minDate?: Date
  maxDate?: Date
  mode?: "single" | "range"
  numberOfMonths?: number
  presets?: DatePickerPreset[]
}

export function DatePicker({
  value,
  onChange,
  disabled,
  className,
  placeholder = "Pick a date",
  minDate,
  maxDate,
  mode = "single",
  numberOfMonths,
  presets,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const isMobile = useIsMobile()

  // On mobile, forcefully restrict numberOfMonths to 1 to avoid overflow.
  const displayMonths = isMobile ? 1 : (numberOfMonths ?? (mode === "range" ? 2 : 1))

  const handleToday = () => {
    if (mode === "single") {
      onChange?.(new Date())
    }
    setOpen(false)
  }

  const handleClear = () => {
    onChange?.(undefined)
    setOpen(false)
  }

  const getDisplayValue = () => {
    if (!value) return <span>{placeholder}</span>
    if (mode === "single") {
      return isValid(value) ? format(value, "dd-MM-yyyy") : <span>{placeholder}</span>
    }
    if (mode === "range" && value.from) {
      if (value.to) {
        return <span className="truncate">{format(value.from, "dd-MM-yyyy")} - {format(value.to, "dd-MM-yyyy")}</span>
      }
      return <span>{format(value.from, "dd-MM-yyyy")} - </span>
    }
    return <span>{placeholder}</span>
  }

  if (isMobile && mode === "single") {
    return (
      <div className="relative">
        <AppIcon name="calendar" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10 pointer-events-none" size="xs" />
        <input
          type="date"
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-9 font-sans",
            !value && "text-muted-foreground",
            className
          )}
          value={value && isValid(value) ? format(value, "yyyy-MM-dd") : ""}
          min={minDate ? format(minDate, "yyyy-MM-dd") : undefined}
          max={maxDate ? format(maxDate, "yyyy-MM-dd") : undefined}
          disabled={disabled === true}
          onChange={(e) => {
            const v = e.target.value
            if (!v) {
              onChange?.(undefined)
            } else {
              const [year, month, day] = v.split("-").map(Number)
              onChange?.(new Date(year, month - 1, day))
            }
          }}
        />
      </div>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-[240px] max-w-full justify-start text-left font-normal bg-card font-sans px-3",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled === true}
        >
          <AppIcon name="calendar" className="mr-2 shrink-0" size="xs" />
          {getDisplayValue()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 font-sans max-w-[95vw] overflow-x-auto" align="start">
        <div className="flex flex-col sm:flex-row">
          {/* Presets Sidebar */}
          {presets && presets.length > 0 && (
            <div className="flex flex-row sm:flex-col gap-1 p-3 border-b sm:border-b-0 sm:border-r overflow-x-auto sm:overflow-visible sm:w-[150px] shrink-0">
              {presets.map((preset, idx) => (
                <Button
                  key={idx}
                  variant="ghost"
                  className="justify-start font-normal text-sm shrink-0"
                  onClick={() => {
                    onChange?.(preset.value)
                    if (mode === "single" || (mode === "range" && preset.value?.from && preset.value?.to)) {
                      setOpen(false)
                    }
                  }}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          )}
          
          <div className="flex flex-col">
            <Calendar
              mode={mode as any}
              selected={value}
              numberOfMonths={displayMonths}
              defaultMonth={mode === "range" && value?.from ? value.from : undefined}
              onSelect={(date: any) => {
                onChange?.(date)
                if (mode === "single") {
                  setOpen(false)
                }
              }}
              initialFocus
              disabled={(date: Date) => {
                if (typeof disabled === 'function') return disabled(date)
                if (Array.isArray(disabled)) return disabled.some(d => d.getTime() === date.getTime())
                if (disabled === true) return true
                if (minDate && date < minDate) return true
                if (maxDate && date > maxDate) return true
                return false
              }}
              classNames={{
                day: cn(
                  "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-neutral-100 dark:[&:has([aria-selected])]:bg-neutral-800",
                  mode === "range"
                    ? "[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
                    : "[&:has([aria-selected])]:rounded-md"
                ),
                day_button: cn(
                  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-50",
                  "h-8 w-8 sm:h-9 sm:w-9 p-0 font-normal aria-selected:opacity-100"
                ),
                weekday: "text-neutral-500 rounded-md w-8 sm:w-9 font-normal text-[0.8rem] dark:text-neutral-400",
              }}
            />
            <div className="flex items-center justify-between p-3 border-t mt-auto">
              <Button variant="ghost" size="sm" onClick={handleToday} className="h-8 px-2 text-xs">
                Today
              </Button>
              <Button variant="ghost" size="sm" onClick={handleClear} className="h-8 px-2 text-xs">
                Clear
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
