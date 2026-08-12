"use client"

import React, { useState, useEffect, startTransition } from "react"
import { Search, X, SlidersHorizontal, Calendar as CalendarIcon } from "lucide-react"
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
import { format } from "date-fns"
import { cn } from "../utils/cn"
import { ArrowDownAZ, ArrowUpAZ, ArrowDown, ArrowUp } from "lucide-react"

export interface FilterOption {
  key: string
  label: string
  type?: "select" | "combobox" | "checkbox-group" | "date-range" | "date"
  options?: { label: string; value: string }[]
  value: any
  onChange: (value: any) => void
}

export interface FilterBarProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  filters?: FilterOption[]
  onClearAll?: () => void
  sortBy?: string
  sortDirection?: "asc" | "desc"
  onSortChange?: (sortBy: string, direction: "asc" | "desc") => void
  sortOptions?: { label: string; value: string }[]
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
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Search...",
  filters = [],
  onClearAll,
  sortBy,
  sortDirection = "asc",
  onSortChange,
  sortOptions = [],
}: FilterBarProps) {
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
  
  const hasActiveFilters = activeFiltersCount > 0 || searchQuery.length > 0

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
        return (
          <Select value={filter.value} onValueChange={filter.onChange}>
            <SelectTrigger className="w-full sm:w-[150px] h-9">
              <SelectValue placeholder={filter.label} />
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
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filter.value?.from ? (
                  filter.value.to ? (
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
        return (
          <Input
            type="date"
            className="h-9 w-full sm:w-[150px] shrink-0"
            value={filter.value || ""}
            onChange={(e) => filter.onChange(e.target.value)}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-3 w-full">
      <div className="flex items-center gap-3 w-full">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-9 h-9"
          />
          {localSearch && (
            <button
              onClick={() => setLocalSearch("")}
              className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Desktop Filters */}
        <div className="hidden md:flex items-center gap-3">
          {filters.map((filter) => (
            <div key={filter.key}>{renderFilterControl(filter)}</div>
          ))}
          {sortOptions.length > 0 && onSortChange && (
            <div className="flex items-center gap-1">
              <Select value={sortBy} onValueChange={(val) => onSortChange(val, sortDirection)}>
                <SelectTrigger className="w-full sm:w-[140px] h-9">
                  <SelectValue placeholder="Sort by" />
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
              >
                {sortDirection === "asc" ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
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
                <SlidersHorizontal className="h-4 w-4" />
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
                <X className="h-3 w-3" />
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
                      <X className="h-3 w-3" />
                    </div>
                  </Badge>
                )
              })
            }
            if (filter.value && filter.value !== "all") {
              if (filter.type === "date-range") {
                if (!filter.value.start && !filter.value.end) return null
                const label = `${filter.value.start || ""} to ${filter.value.end || ""}`
                return (
                  <Badge key={filter.key} variant="secondary" className="pl-3 pr-1 h-6 rounded-full flex items-center gap-1 font-normal">
                    {filter.label}: {label}
                    <div
                      role="button"
                      className="h-4 w-4 rounded-full hover:bg-muted flex items-center justify-center cursor-pointer"
                      onClick={() => filter.onChange("all")}
                    >
                      <X className="h-3 w-3" />
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
                    <X className="h-3 w-3" />
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
