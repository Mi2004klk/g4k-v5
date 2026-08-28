import * as React from "react"
import { cn } from "../utils/cn"
import { AppIcon } from "./icon/AppIcon"

export interface TimeInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const TimeInput = React.forwardRef<HTMLInputElement, TimeInputProps>(
  ({ className, disabled, value, onChange, ...props }, ref) => {
    return (
      <div className="relative">
        <AppIcon 
          name="clock" 
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10 pointer-events-none" 
          size="xs" 
        />
        <input
          type="time"
          ref={ref}
          className={cn(
            "flex h-10 w-full rounded-[var(--radius)] border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-9 font-sans",
            !value && "text-muted-foreground",
            className
          )}
          value={value}
          onChange={onChange}
          disabled={disabled === true}
          {...props}
        />
      </div>
    )
  }
)

TimeInput.displayName = "TimeInput"
