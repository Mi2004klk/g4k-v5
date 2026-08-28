"use client"

import * as React from "react"
import { AppIcon } from "./icon/AppIcon";

import { cn } from "../utils/cn"
import { Button, buttonVariants } from "./button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select"

export interface PaginationProps extends React.HTMLAttributes<HTMLElement> {
  variant?: "standard" | "infinite"
  
  // Standard props
  currentPage?: number
  totalPages?: number
  hasNextPage?: boolean
  hasPreviousPage?: boolean
  onNextPage?: () => void
  onPreviousPage?: () => void
  
  // Page size props
  pageSize?: number
  pageSizeOptions?: number[]
  onPageSizeChange?: (size: number) => void
  
  // Infinite scroll props
  onLoadMore?: () => void
  isLoading?: boolean
}

export function Pagination({
  className,
  variant = "standard",
  currentPage = 1,
  totalPages,
  hasNextPage,
  hasPreviousPage,
  onNextPage,
  onPreviousPage,
  pageSize = 20,
  pageSizeOptions = [20, 50, 100],
  onPageSizeChange,
  onLoadMore,
  isLoading,
  ...props
}: PaginationProps) {
  if (variant === "infinite") {
    if (!hasNextPage) return null
    return (
      <div className={cn("flex w-full justify-center py-4", className)} {...props}>
        <Button
          variant="outline"
          onClick={onLoadMore}
          disabled={isLoading}
          className="w-full sm:w-auto"
        >
          {isLoading && <AppIcon name="loading" className="mr-2 motion-safe:animate-spin" />}
          {isLoading ? "Loading..." : "Load more"}
        </Button>
      </div>
    )
  }

  // Standard Variant
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      className={cn("flex items-center justify-between w-full", className)}
      {...props}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground hidden sm:block">Rows per page:</span>
        <Select
          value={pageSize.toString()}
          onValueChange={(val) => onPageSizeChange?.(Number(val))}
        >
          <SelectTrigger className="h-8 w-[70px]">
            <SelectValue placeholder={pageSize} />
          </SelectTrigger>
          <SelectContent side="top">
            {pageSizeOptions.map((size) => (
              <SelectItem key={size} value={size.toString()}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-row items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onPreviousPage}
          disabled={!hasPreviousPage}
          aria-label="Go to previous page"
        >
          <AppIcon name="chevronLeft" />
        </Button>

        <div className="flex items-center justify-center text-sm font-medium px-2">
          {totalPages ? `Page ${currentPage} of ${totalPages}` : `Page ${currentPage}`}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onNextPage}
          disabled={!hasNextPage}
          aria-label="Go to next page"
        >
          <AppIcon name="chevronRight" />
        </Button>
      </div>
    </nav>
  )
}
