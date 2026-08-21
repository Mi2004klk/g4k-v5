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

export interface DatePickerProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  disabled?: boolean
  className?: string
  placeholder?: string
  minDate?: Date
  maxDate?: Date
}

export function DatePicker({
  value,
  onChange,
  disabled = false,
  className,
  placeholder = "Pick a date",
  minDate,
  maxDate,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const isMobile = useIsMobile()

  if (isMobile) {
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
          disabled={disabled}
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
            "w-[240px] justify-start text-left font-normal bg-card font-sans",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <AppIcon name="calendar" className="mr-2" size="xs" />
          {value && isValid(value) ? format(value, "dd-MM-yyyy") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 font-sans" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date: Date | undefined) => {
            onChange?.(date)
            setOpen(false)
          }}
          initialFocus
          disabled={(date: Date) => {
            if (minDate && date < minDate) return true
            if (maxDate && date > maxDate) return true
            return false
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
