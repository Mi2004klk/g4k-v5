"use client"

import * as React from "react"
import { AppIcon } from "./icon/AppIcon";
import { DayPicker } from "react-day-picker"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={["p-3", className].filter(Boolean).join(" ")}
      classNames={{
        months: "flex flex-col sm:flex-row gap-4",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        month_caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        button_previous: "absolute left-1 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 flex items-center justify-center rounded-[var(--radius)] hover:bg-surface-2 transition-colors",
        button_next: "absolute right-1 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 flex items-center justify-center rounded-[var(--radius)] hover:bg-surface-2 transition-colors",
        month_grid: "w-full border-collapse space-y-1",
        weekdays: "flex",
        weekday: "text-muted rounded-[var(--radius)] w-9 font-normal text-[0.8rem]",
        week: "flex w-full mt-2",
        day: "h-9 w-9 p-0 font-normal rounded-[var(--radius)] aria-selected:opacity-100 hover:bg-surface-2 transition-colors flex items-center justify-center",
        range_end: "day-range-end rounded-r-md",
        range_start: "rounded-l-md",
        selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        today: "ring-1 ring-primary font-bold",
        outside: "day-outside text-muted opacity-50 aria-selected:bg-primary/20 aria-selected:text-muted aria-selected:opacity-30",
        disabled: "text-muted opacity-50 line-through",
        range_middle: "aria-selected:bg-primary/20 aria-selected:text-foreground",
        hidden: "invisible",
        ...classNames,
      }}
      
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
