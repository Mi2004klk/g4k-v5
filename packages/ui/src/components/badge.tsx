import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../utils/cn"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export type StatusType = "neutral" | "info" | "warning" | "success" | "danger";

const statusColorMap: Record<StatusType, { bg: string, text: string, dot: string }> = {
  neutral: { bg: "bg-neutral-status/10", text: "text-neutral-status", dot: "bg-neutral-status" },
  info: { bg: "bg-info/10", text: "text-info", dot: "bg-info" },
  warning: { bg: "bg-warning/10", text: "text-warning", dot: "bg-warning" },
  success: { bg: "bg-success/10", text: "text-success", dot: "bg-success" },
  danger: { bg: "bg-danger/10", text: "text-danger", dot: "bg-danger" },
};

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  status: StatusType;
  dot?: boolean;
}

function StatusBadge({ className, status, dot = false, children, ...props }: StatusBadgeProps) {
  const colors = statusColorMap[status];

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors duration-150",
        colors.bg,
        colors.text,
        className
      )}
      {...props}
    >
      {dot && (
        <span className={cn("mr-1.5 h-1.5 w-1.5 rounded-full", colors.dot)} aria-hidden="true" />
      )}
      {children}
    </div>
  )
}

export { Badge, badgeVariants, StatusBadge }
