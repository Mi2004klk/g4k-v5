"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "../utils/cn"

const TooltipProvider = ({
  delayDuration = 150,
  ...props
}: React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Provider>) => (
  <TooltipPrimitive.Provider delayDuration={delayDuration} {...props} />
)

const Tooltip = TooltipPrimitive.Root

const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md duration-150 animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-tooltip-content-transform-origin]",
      className
    )}
    // Prevents tooltips from opening on touch devices per R3.13 / tooltip spec
    onPointerDownOutside={(e: any) => {
      if (e.detail?.originalEvent?.pointerType === "touch" || e.pointerType === "touch") e.preventDefault()
    }}
    {...props}
  />
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

// Wrapper for elements that may be disabled (so tooltip still works)
const TooltipWrapper = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ children, className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("inline-block", className)}
      {...props}
    >
      {children}
    </div>
  )
})
TooltipWrapper.displayName = "TooltipWrapper"

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider, TooltipWrapper }
