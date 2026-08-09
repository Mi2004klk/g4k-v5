import { cn } from "../utils/cn"

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  shape?: "card" | "row" | "text" | "avatar"
}

function Skeleton({ className, shape = "text", ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-muted",
        {
          "h-32 w-full rounded-xl": shape === "card",
          "h-12 w-full rounded-md": shape === "row",
          "h-4 w-full rounded": shape === "text",
          "h-10 w-10 rounded-full": shape === "avatar",
        },
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
