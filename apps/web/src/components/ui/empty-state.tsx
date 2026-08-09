import React from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 min-h-[220px]",
        className
      )}
      {...props}
    >
      {icon ? (
        <div className="mb-4 text-neutral-400 dark:text-neutral-500">{icon}</div>
      ) : (
        <video
          src="/animated-logo.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="w-16 h-16 opacity-75 mb-4 rounded-full"
        />
      )}
      <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400 max-w-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
