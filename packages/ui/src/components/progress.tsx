"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../utils/cn"

const progressVariants = cva(
  "relative w-full overflow-hidden rounded-full bg-secondary",
  {
    variants: {
      size: {
        default: "h-4",
        sm: "h-2",
        lg: "h-6",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

export interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>,
    VariantProps<typeof progressVariants> {
  value?: number
  isOverdue?: boolean
  striped?: boolean
  indicatorColorClass?: string
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, size, isOverdue, striped, indicatorColorClass, ...props }, ref) => {
  // Determine color based on rules
  let colorClass = indicatorColorClass || "bg-primary";
  if (value === 100) {
    colorClass = "bg-success";
  } else if (isOverdue) {
    colorClass = "bg-warning";
  }

  const stripedStyle = striped
    ? {
        backgroundImage:
          "linear-gradient(45deg, rgba(255,255,255,.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.15) 50%, rgba(255,255,255,.15) 75%, transparent 75%, transparent)",
        backgroundSize: "1rem 1rem",
      }
    : {};

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(progressVariants({ size }), className)}
      {...props}
    >
      <style>{`
        @keyframes progress-stripe-anim {
          from { background-position: 1rem 0; }
          to { background-position: 0 0; }
        }
      `}</style>
      <ProgressPrimitive.Indicator
        className={cn(
          "h-full w-full flex-1 transition-all duration-600",
          colorClass,
          striped && "animate-[progress-stripe-anim_1s_linear_infinite]"
        )}
        style={{ 
          transform: `translateX(-${100 - (value || 0)}%)`,
          ...stripedStyle
        }}
      />
    </ProgressPrimitive.Root>
  )
})
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
