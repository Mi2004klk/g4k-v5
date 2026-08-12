import * as React from "react"
import { Inbox } from "lucide-react"
import { cn } from "../utils/cn"

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  icon?: React.ReactNode
  videoSrc?: string
  action?: React.ReactNode
}

export function EmptyState({
  title,
  description,
  icon,
  videoSrc,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-[160px] flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center bg-card text-card-foreground shadow-none",
        className
      )}
      {...props}
    >
      {icon ? (
        <div className="mb-3 text-muted-foreground/60">{icon}</div>
      ) : videoSrc ? (
        <video
          src={videoSrc}
          autoPlay
          loop
          muted
          playsInline
          className="mb-3 h-12 w-12 opacity-50 rounded-full"
        />
      ) : (
        <Inbox className="mb-3 h-10 w-10 text-muted-foreground/40" />
      )}
      <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">{title}</h3>
      {description && (
        <p className="mt-1 max-w-[250px] mx-auto text-xs text-neutral-400">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
