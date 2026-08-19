"use client"

import React, { useState, useEffect, startTransition } from "react"
import { AppIcon } from "./icon/AppIcon";
import { Input } from "./input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select"
import { Button } from "./button"
import { Badge } from "./badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./sheet"
import { Checkbox } from "./checkbox"
import { Combobox } from "./combobox"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { Calendar } from "./calendar"
import { format, isValid } from "date-fns"
import { cn } from "../utils/cn"


export interface FilterOption {
  key: string
  label: string
  type?: "select" | "combobox" | "checkbox-group" | "date-range" | "date"
  options?: { label: string; value: string }[]
  value: any
  onChange: (value: any) => void
}

export interface FilterBarProps {
  searchQuery?: string
  onSearchChange?: (value: string) => void
  hideSearch?: boolean
  searchPlaceholder?: string
  filters?: FilterOption[]
  onClearAll?: () => void
  sortBy?: string
  sortDirection?: "asc" | "desc"
  onSortChange?: (sortBy: string, direction: "asc" | "desc") => void
  sortOptions?: { label: string; value: string }[]
  searchInputId?: string
}

function useDebounce<T>(value: T, delay?: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay || 500)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debouncedValue
}

export function FilterBar({
  searchQuery = "",
  onSearchChange = () => {},
  hideSearch = false,
  searchPlaceholder = "Search...",
  filters = [],
  onClearAll,
  sortBy,
  sortDirection = "asc",
  onSortChange,
  sortOptions = [],
  searchInputId,
}: FilterBarProps): React.JSX.Element | null {
  const [localSearch, setLocalSearch] = useState(searchQuery)
  const debouncedSearch = useDebounce(localSearch, 250)

  useEffect(() => {
    if (debouncedSearch !== searchQuery) {
      startTransition(() => {
        onSearchChange(debouncedSearch)
      })
    }
  }, [debouncedSearch, onSearchChange, searchQuery])

  // Sync external changes
  useEffect(() => {
    setLocalSearch(searchQuery)
  }, [searchQuery])

  const activeFiltersCount = filters.reduce((acc, f) => {
    if (f.type === "checkbox-group" && Array.isArray(f.value)) return acc + f.value.length
    if (f.value && f.value !== "all") return acc + 1
    return acc
  }, 0)
  
  const hasActiveFilters = activeFiltersCount > 0 || (searchQuery?.length || 0) > 0

  const handleClearAll = () => {
    setLocalSearch("")
    onSearchChange("")
    filters.forEach((f) => {
      f.onChange(f.type === "checkbox-group" ? [] : "all")
    })
    if (onClearAll) onClearAll()
  }

  const renderFilterControl = (filter: FilterOption) => {
    switch (filter.type) {
      case "select":
        const isActive = filter.value && filter.value !== "all";
        return (
          <Select value={filter.value} onValueChange={filter.onChange}>
            <SelectTrigger className={cn("w-full sm:w-auto min-w-[130px] h-9 transition-colors", isActive && "border-primary-300 dark:border-primary-700 bg-primary-50/30 dark:bg-primary-900/10")}>
              <SelectValue placeholder={filter.label}>
                {isActive ? (
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-500"></span>
                    <span className="text-neutral-500 font-normal">{filter.label}:</span>
                    <span className="font-semibold">{filter.options?.find(o => o.value === filter.value)?.label}</span>
                  </div>
                ) : (
                  <span>{filter.label}</span>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All {filter.label}</SelectItem>
              {filter.options?.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      case "combobox":
        return (
          <Combobox
            options={filter.options || []}
            value={filter.value === "all" ? "" : filter.value}
            onChange={(val: string) => filter.onChange(val || "all")}
            placeholder={`Select ${filter.label}`}
          />
        )
      case "checkbox-group":
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full sm:w-[150px] justify-between h-9 text-muted-foreground font-normal">
                <span className="truncate">
                  {filter.value?.length > 0
                    ? `${filter.label} (${filter.value.length})`
                    : `All ${filter.label}s`}
                </span>
                <span className="opacity-50 text-[10px]">▼</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-2" align="start">
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {filter.options?.map((opt) => {
                  const isChecked = Array.isArray(filter.value) && filter.value.includes(opt.value)
                  return (
                    <label key={opt.value} className="flex items-center gap-2 text-sm p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded cursor-pointer">
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={(checked) => {
                          const current = Array.isArray(filter.value) ? filter.value : []
                          if (checked) filter.onChange([...current, opt.value])
                          else filter.onChange(current.filter((v: string) => v !== opt.value))
                        }}
                      />
                      <span className="truncate">{opt.label}</span>
                    </label>
                  )
                })}
              </div>
              {filter.value?.length > 0 && (
                <div className="pt-2 mt-2 border-t border-neutral-100 dark:border-neutral-800">
                  <Button variant="ghost" size="sm" className="w-full text-xs h-7" onClick={() => filter.onChange([])}>
                    Clear selections
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        )
      case "date-range":
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full sm:w-[260px] justify-start text-left font-normal h-9",
                  !filter.value?.from && "text-muted-foreground"
                )}
              >
                <AppIcon name="calendar" className="mr-2 " />
                  {isValid(filter.value.from) ? (
                    filter.value.to && isValid(filter.value.to) ? (
                      <>
                        {format(filter.value.from, "LLL dd, y")} -{" "}
                        {format(filter.value.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(filter.value.from, "LLL dd, y")
                    )
                  ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={filter.value?.from}
                selected={filter.value}
                onSelect={(range: { from?: Date, to?: Date } | undefined) => {
                  if (!range) return;
                  filter.onChange({ from: range.from, to: range.to });
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        )
      case "date":
        const singleDateVal = filter.value ? new Date(filter.value) : undefined;
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-9 justify-start text-left font-normal border-dashed border-border/80 shadow-2xs text-xs min-w-[140px]",
                  !filter.value && "text-muted-foreground"
                )}
              >
                <AppIcon name="calendar" size="xs" className="mr-2 text-muted-foreground shrink-0" />
                {singleDateVal && isValid(singleDateVal) ? format(singleDateVal, "MMM d, yyyy") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={singleDateVal && isValid(singleDateVal) ? singleDateVal : undefined}
                onSelect={(d: Date | undefined) => {
                  if (d && isValid(d)) {
                    filter.onChange(format(d, "yyyy-MM-dd"));
                  } else {
                    filter.onChange("");
                  }
                }}
              />
            </PopoverContent>
          </Popover>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-3 w-full">
      <div className="flex items-center gap-3 w-full">
        {!hideSearch && (
          <div className="relative flex-1 w-full sm:max-w-sm">
          <AppIcon name="search" className="absolute left-2.5 top-2.5 text-muted-foreground" />
          <Input
            id={searchInputId}
            placeholder={searchPlaceholder}
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full sm:w-[280px] lg:w-[320px] h-9 pl-9 pr-8"
          />
          {localSearch && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full"
              onClick={() => {
                setLocalSearch("")
                onSearchChange("")
              }}
              aria-label="Clear search"
            >
              <AppIcon name="close" size="sm" />
            </Button>
          )}
        </div>
        )}

        {/* Desktop Filters */}
        <div className="hidden md:flex items-center gap-3">
          {filters.map((filter) => (
            <div key={filter.key}>{renderFilterControl(filter)}</div>
          ))}
          {sortOptions.length > 0 && onSortChange && (
            <div className="flex items-center gap-1">
              <Select value={sortBy} onValueChange={(val) => onSortChange(val, sortDirection)}>
                <SelectTrigger className="w-full sm:w-auto min-w-[140px] h-9">
                  <SelectValue placeholder="Sort by">
                    {sortBy ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-neutral-500 font-normal">Sort:</span>
                        <span className="font-semibold">{sortOptions.find(o => o.value === sortBy)?.label}</span>
                      </div>
                    ) : (
                      <span>Sort by</span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-9 w-9 text-muted-foreground"
                onClick={() => onSortChange(sortBy || sortOptions[0].value, sortDirection === "asc" ? "desc" : "asc")}
                title={`Sort ${sortDirection === "asc" ? "Descending" : "Ascending"}`}
                aria-label={`Sort ${sortDirection === "asc" ? "Descending" : "Ascending"}`}
              >
                {sortDirection === "asc" ? <AppIcon name="arrowUp" /> : <AppIcon name="arrowDown" />}
              </Button>
            </div>
          )}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              onClick={handleClearAll}
              className="h-9 px-3 text-muted-foreground hover:text-foreground"
            >
              Clear all
            </Button>
          )}
        </div>

        {/* Mobile Filters Sheet */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 flex items-center gap-2">
                <AppIcon name="sliders" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-1 px-1.5 h-5 rounded-full text-xs">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                {filters.map((filter) => (
                  <div key={filter.key} className="space-y-2">
                    <label className="text-sm font-medium">{filter.label}</label>
                    {renderFilterControl(filter)}
                  </div>
                ))}
                {hasActiveFilters && (
                  <Button variant="outline" onClick={handleClearAll} className="w-full">
                    Clear all
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Filter Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground mr-1">Active filters:</span>
          {searchQuery && (
            <Badge variant="secondary" className="pl-3 pr-1 h-6 rounded-full flex items-center gap-1 font-normal">
              Search: {searchQuery}
              <div
                role="button"
                className="h-4 w-4 rounded-full hover:bg-muted flex items-center justify-center cursor-pointer"
                onClick={() => setLocalSearch("")}
              >
                <AppIcon name="close" size="xs" />
              </div>
            </Badge>
          )}
          {filters.map((filter) => {
            if (filter.type === "checkbox-group" && Array.isArray(filter.value)) {
              return filter.value.map((v) => {
                const optLabel = filter.options?.find((o) => o.value === v)?.label || v
                return (
                  <Badge key={`${filter.key}-${v}`} variant="secondary" className="pl-3 pr-1 h-6 rounded-full flex items-center gap-1 font-normal">
                    {filter.label}: {optLabel}
                    <div
                      role="button"
                      className="h-4 w-4 rounded-full hover:bg-muted flex items-center justify-center cursor-pointer"
                      onClick={() => filter.onChange(filter.value.filter((val: string) => val !== v))}
                    >
                      <AppIcon name="close" size="xs" />
                    </div>
                  </Badge>
                )
              })
            }
            if (filter.value && filter.value !== "all") {
              if (filter.type === "date-range") {
                if (!filter.value.from && !filter.value.to) return null
                const fromLabel = filter.value.from && isValid(filter.value.from) ? format(filter.value.from, "MMM d") : ""
                const toLabel = filter.value.to && isValid(filter.value.to) ? format(filter.value.to, "MMM d") : ""
                const label = `${fromLabel} to ${toLabel}`
                return (
                  <Badge key={filter.key} variant="secondary" className="pl-3 pr-1 h-6 rounded-full flex items-center gap-1 font-normal">
                    {filter.label}: {label}
                    <div
                      role="button"
                      className="h-4 w-4 rounded-full hover:bg-muted flex items-center justify-center cursor-pointer"
                      onClick={() => filter.onChange({ from: undefined, to: undefined })}
                    >
                      <AppIcon name="close" size="xs" />
                    </div>
                  </Badge>
                )
              }
              const optLabel = filter.options?.find((o) => o.value === filter.value)?.label || filter.value
              return (
                <Badge key={filter.key} variant="secondary" className="pl-3 pr-1 h-6 rounded-full flex items-center gap-1 font-normal">
                  {filter.label}: {optLabel}
                  <div
                    role="button"
                    className="h-4 w-4 rounded-full hover:bg-muted flex items-center justify-center cursor-pointer"
                    onClick={() => filter.onChange("all")}
                  >
                    <AppIcon name="close" size="xs" />
                  </div>
                </Badge>
              )
            }
            return null
          })}
        </div>
      )}
    </div>
  )
}
