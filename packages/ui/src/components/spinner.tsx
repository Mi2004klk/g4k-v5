import * as React from "react";
import { AppIcon } from "./icon/AppIcon";
import { cn } from "../utils/cn";

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function Spinner({ size = "sm", className, ...props }: SpinnerProps) {
  return (
    <div className={cn("inline-flex items-center justify-center", className)} {...props}>
      <AppIcon name="loading" size={size} className="animate-spin text-muted-foreground" />
    </div>
  );
}
