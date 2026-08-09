import * as React from "react"
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
        "flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center bg-card text-card-foreground shadow-sm",
        className
      )}
      {...props}
    >
      {icon ? (
        <div className="mb-4 text-muted-foreground">{icon}</div>
      ) : videoSrc ? (
        <video
          src={videoSrc}
          autoPlay
          loop
          muted
          playsInline
          className="mb-4 h-16 w-16 opacity-75 rounded-full"
        />
      ) : (
        <video
          src="/animated-logo.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="mb-4 h-16 w-16 opacity-75 rounded-full"
        />
      )}
      <h3 className="text-base font-semibold">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
