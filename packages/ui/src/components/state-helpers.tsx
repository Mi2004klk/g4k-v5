import React from "react"
import { AppIcon } from "./icon/AppIcon"
import { Button } from "./button"
import { Skeleton } from "./skeleton"
import { EmptyState } from "./empty-state"

export const emptyStateDefaults = {
  tasks:         { title: "No tasks yet",           description: "Create your first task to get started.",            icon: "tasks" as const },
  projects:      { title: "No projects yet",        description: "Start a new project to organize your work.",       icon: "projects" as const },
  leaves:        { title: "No leave requests",      description: "Your leave history will appear here.",             icon: "calendar" as const },
  conversations: { title: "No conversations",       description: "Start a chat to begin messaging.",                 icon: "chat" as const },
  notifications: { title: "All caught up",          description: "You have no new notifications.",                   icon: "bell" as const },
  departments:   { title: "No departments",         description: "Create departments to organize your team.",        icon: "organization" as const },
  designations:  { title: "No designations",        description: "Create designations to define team roles.",        icon: "badge" as const },
  members:       { title: "No team members",        description: "Invite team members to get started.",              icon: "users" as const },
  holidays:      { title: "No holidays configured", description: "Add holidays to your company calendar.",           icon: "calendar" as const },
  reports:       { title: "No reports generated",   description: "Run a report to see data here.",                   icon: "spreadsheet" as const },
  auditLogs:     { title: "No audit logs",          description: "Activity will be recorded here.",                  icon: "shield" as const },
} as const;

export function ContentSkeleton({ type = "table", rows = 5 }: { type?: "table" | "card-grid" | "detail", rows?: number }) {
  if (type === "table") {
    return (
      <div className="w-full space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 p-4 border rounded-xl animate-pulse bg-card">
            <Skeleton className="h-4 w-12 rounded" />
            <Skeleton className="h-4 w-1/4 rounded" />
            <Skeleton className="h-4 w-1/4 rounded" />
            <Skeleton className="h-4 w-1/3 rounded" />
          </div>
        ))}
      </div>
    )
  }
  
  if (type === "card-grid") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-6 border rounded-xl animate-pulse space-y-4 bg-card shadow-2xs">
            <Skeleton className="h-6 w-3/4 rounded" />
            <Skeleton className="h-4 w-1/2 rounded" />
            <div className="pt-4 space-y-2">
              <Skeleton className="h-3 w-full rounded" />
              <Skeleton className="h-3 w-4/5 rounded" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-pulse p-6 bg-card border rounded-xl shadow-2xs">
      <Skeleton className="h-8 w-1/3 rounded" />
      <div className="space-y-3 pt-4">
        <Skeleton className="h-4 w-full rounded" />
        <Skeleton className="h-4 w-5/6 rounded" />
        <Skeleton className="h-4 w-4/5 rounded" />
      </div>
    </div>
  )
}

export function IsolatedError({ error, onRetry }: { error?: Error | string, onRetry?: () => void }) {
  return (
    <div className="p-6 flex flex-col items-center justify-center text-center border border-destructive/20 bg-destructive/5 rounded-xl gap-3">
      <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
        <AppIcon name="warning" />
      </div>
      <div>
        <h3 className="font-semibold text-destructive">Failed to load content</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          {typeof error === "string" ? error : error?.message || "An unexpected error occurred while fetching data."}
        </p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-2 border-destructive/30 text-destructive hover:bg-destructive hover:text-white">
          Try Again
        </Button>
      )}
    </div>
  )
}

export function MeaningfulEmpty({ entityName, description, actionLabel, onAction, icon = "inbox" }: { entityName: string, description?: string, actionLabel?: string, onAction?: () => void, icon?: any }) {
  return (
    <EmptyState
      title={`No ${entityName} found`}
      description={description || `There are currently no ${entityName.toLowerCase()} to display here.`}
      icon={typeof icon === "string" ? <AppIcon name={icon as any} className="text-muted-foreground/40 w-12 h-12" /> : icon}
      action={onAction ? <Button size="sm" onClick={onAction}>{actionLabel || `Create ${entityName}`}</Button> : undefined}
    />
  )
}

export function PermissionDenied({ onBack }: { onBack?: () => void }) {
  return (
    <div className="p-12 flex flex-col items-center justify-center text-center max-w-md mx-auto gap-4">
      <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
        <AppIcon name="shield" size="lg" />
      </div>
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Access Denied</h2>
        <p className="text-muted-foreground mt-2">
          You don't have the required permissions to view this content or perform this action.
        </p>
      </div>
      {onBack && (
        <Button onClick={onBack} variant="outline" className="mt-4">
          Go Back
        </Button>
      )}
    </div>
  )
}

export function DisabledWhileSubmitting({ isSubmitting, children }: { isSubmitting: boolean, children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      {isSubmitting && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-[1px] rounded-inherit">
          <div className="flex flex-col items-center gap-2 px-4 py-3 bg-card border shadow-e3 rounded-xl">
            <AppIcon name="loading" size="lg" className="motion-safe:animate-spin text-primary" />
            <span className="text-xs font-medium text-foreground">Processing...</span>
          </div>
        </div>
      )}
    </div>
  )
}

export function ValidationSummary({ errors }: { errors: Record<string, any> }) {
  const errorKeys = Object.keys(errors)
  if (errorKeys.length === 0) return null

  return (
    <div className="p-3 mb-4 text-sm border rounded-[var(--radius)] bg-destructive/10 border-destructive/20 text-destructive">
      <div className="flex items-center gap-2 mb-2 font-semibold">
        <AppIcon name="warning" size="sm" />
        Please correct the following errors:
      </div>
      <ul className="pl-6 space-y-1 list-disc text-xs">
        {errorKeys.map((key) => (
          <li key={key}>{errors[key]?.message as string || "Invalid input"}</li>
        ))}
      </ul>
    </div>
  )
}
