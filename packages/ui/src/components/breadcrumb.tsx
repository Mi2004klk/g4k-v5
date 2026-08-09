"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, MoreHorizontal } from "lucide-react"

import { cn } from "../utils/cn"
import { Button } from "./button"

export interface BreadcrumbOverrides {
  [pathSegment: string]: {
    label: string
    href?: string
  }
}

export interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  overrides?: BreadcrumbOverrides
  hiddenOnRoot?: boolean
  rootPath?: string
}

export function Breadcrumb({
  className,
  overrides = {},
  hiddenOnRoot = true,
  rootPath = "/dashboard",
  ...props
}: BreadcrumbProps) {
  const pathname = usePathname()

  if (hiddenOnRoot && pathname === rootPath) {
    return null
  }

  // Remove trailing slashes and split
  const pathSegments = pathname.replace(/\/$/, "").split("/").filter(Boolean)

  if (pathSegments.length === 0) {
    return null
  }

  const breadcrumbs = pathSegments.map((segment: string, index: number) => {
    const currentPath = `/${pathSegments.slice(0, index + 1).join("/")}`
    const override = overrides[segment]

    return {
      id: currentPath,
      label: override?.label || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " "),
      href: override?.href || currentPath,
      isLast: index === pathSegments.length - 1,
    }
  })

  // Logic for truncating middle breadcrumbs on narrow viewports
  const MAX_ITEMS = 3
  const shouldTruncate = breadcrumbs.length > MAX_ITEMS
  
  const renderBreadcrumbItem = (item: typeof breadcrumbs[0]) => {
    return (
      <div key={item.id} className="flex items-center">
        {item.isLast ? (
          <span className="text-sm font-semibold text-foreground" aria-current="page">
            {item.label}
          </span>
        ) : (
          <Link
            href={item.href}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {item.label}
          </Link>
        )}
        {!item.isLast && <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground" />}
      </div>
    )
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center break-words text-muted-foreground sm:text-sm", className)}
      {...props}
    >
      <ol className="flex items-center gap-1.5 sm:gap-2.5">
        {!shouldTruncate ? (
          breadcrumbs.map(renderBreadcrumbItem)
        ) : (
          <>
            {renderBreadcrumbItem(breadcrumbs[0])}
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 pointer-events-none"
                aria-label="More items"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
              <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground" />
            </div>
            {renderBreadcrumbItem(breadcrumbs[breadcrumbs.length - 2])}
            {renderBreadcrumbItem(breadcrumbs[breadcrumbs.length - 1])}
          </>
        )}
      </ol>
    </nav>
  )
}
