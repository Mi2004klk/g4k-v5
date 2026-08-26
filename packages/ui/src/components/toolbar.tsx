"use client"

import React, { useState, useEffect, startTransition } from "react"
import { AppIcon } from "./icon/AppIcon"
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

export interface ToolbarProps {
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
  actions?: React.ReactNode
}

function useDebounce<T>(value: T, delay?: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay || 500)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debouncedValue
}

export function Toolbar({
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
  actions,
}: ToolbarProps): React.JSX.Element {
  const [localSearch, setLocalSearch] = useState(searchQuery)
  const debouncedSearch = useDebounce(localSearch, 250)

  useEffect(() => {
    if (debouncedSearch !== searchQuery) {
      startTransition(() => {
        onSearchChange(debouncedSearch)
      })
    }
  }, [debouncedSearch, onSearchChange, searchQuery])

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
        return (
          <Select value={filter.value} onValueChange={filter.onChange}>
            <SelectTrigger className="w-full h-9 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
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
          <div className="space-y-2 max-h-[200px] overflow-y-auto border border-neutral-200 dark:border-neutral-800 rounded-md p-2">
            {filter.options?.map((opt) => {
              const isChecked = Array.isArray(filter.value) && filter.value.includes(opt.value)
              return (
                <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50 p-1 rounded">
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
        )
      case "date-range":
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal h-9 bg-white dark:bg-neutral-900",
                  !filter.value?.from && "text-muted-foreground"
                )}
              >
                <AppIcon name="calendar" className="mr-2" size="sm" />
                {isValid(filter.value?.from) ? (
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
            <PopoverContent className="w-auto p-0" align="start">
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
                className={cn(
                  "w-full justify-start text-left font-normal h-9 bg-white dark:bg-neutral-900",
                  !filter.value && "text-muted-foreground"
                )}
              >
                <AppIcon name="calendar" size="sm" className="mr-2 shrink-0" />
                {singleDateVal && isValid(singleDateVal) ? format(singleDateVal, "MMM d, yyyy") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
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

  const [isSearchExpanded, setIsSearchExpanded] = useState(!!searchQuery)

  return (
    <div className="flex flex-col w-full gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3 w-full">
        {/* Left Side: Search */}
        <div className="flex items-center gap-2 shrink-0 flex-1 min-w-[200px]">
          {!hideSearch && (
            <div className={cn("transition-all duration-300 ease-in-out relative shrink-0", isSearchExpanded ? "w-full max-w-[260px] md:max-w-[300px]" : "w-9")}>
              {isSearchExpanded ? (
                <>
                  <AppIcon name="search" className="absolute left-2.5 top-2.5 text-muted-foreground" size="sm" />
                  <Input
                    id={searchInputId}
                    placeholder={searchPlaceholder}
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    className="w-full h-9 pl-8 pr-8 text-sm bg-neutral-50 dark:bg-neutral-900 border-dashed"
                    autoFocus
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-full"
                    onClick={() => {
                      setLocalSearch("")
                      onSearchChange("")
                      setIsSearchExpanded(false)
                    }}
                    aria-label="Clear search"
                  >
                    <AppIcon name="close" size="xs" />
                  </Button>
                </>
              ) : (
                <Button variant="outline" size="icon" className="h-9 w-9 border-dashed border-border/80 shadow-2xs shrink-0 bg-neutral-50 dark:bg-neutral-900" onClick={() => setIsSearchExpanded(true)}>
                  <AppIcon name="search" size="sm" className="text-muted-foreground" />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Filters, Sort, Actions */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          {filters.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-2 border-dashed border-border/80 shadow-2xs bg-neutral-50 dark:bg-neutral-900">
                  <AppIcon name="sliders" size="sm" className="text-muted-foreground" />
                  <span className="hidden sm:inline">Filters</span>
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="px-1.5 h-5 rounded-full text-[10px]">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[320px] p-4 shadow-e2 rounded-xl" align="end">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Filters</h4>
                  {activeFiltersCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={handleClearAll} className="h-7 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30">
                      Clear all
                    </Button>
                  )}
                </div>
                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1 thin-scrollbar">
                  {filters.map((filter) => (
                    <div key={filter.key} className="space-y-1.5">
                      <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">{filter.label}</label>
                      {renderFilterControl(filter)}
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )}
          
          {sortOptions.length > 0 && onSortChange && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-2 border-dashed border-border/80 shadow-2xs bg-neutral-50 dark:bg-neutral-900">
                  <AppIcon name="arrowDown" size="sm" className="text-muted-foreground" />
                  <span className="hidden sm:inline">Sort</span>
                  {sortBy && (
                    <Badge variant="secondary" className="px-1.5 h-5 rounded-full text-[10px]">
                      {sortOptions.find(o => o.value === sortBy)?.label}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-3 shadow-e2 rounded-xl" align="end">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-[10px] font-bold text-neutral-500 mb-2 px-1 uppercase tracking-wider">Sort By</h4>
                    <div className="space-y-1">
                      {sortOptions.map(opt => (
                        <label key={opt.value} className="flex items-center gap-2 px-2 py-1.5 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md cursor-pointer transition-colors">
                          <input 
                            type="radio" 
                            name="sortBy" 
                            checked={sortBy === opt.value} 
                            onChange={() => onSortChange(opt.value, sortDirection)}
                            className="accent-primary-600 w-3.5 h-3.5"
                          />
                          {opt.label}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800">
                    <h4 className="text-[10px] font-bold text-neutral-500 mb-2 px-1 uppercase tracking-wider">Order</h4>
                    <div className="flex gap-2">
                      <Button 
                        variant={sortDirection === "asc" ? "primary" : "outline"} 
                        size="sm" 
                        className={cn("flex-1 h-8 text-xs", sortDirection === "asc" ? "bg-primary-600 text-white" : "")}
                        onClick={() => sortBy && onSortChange(sortBy, "asc")}
                      >
                        <AppIcon name="arrowUp" size="xs" className="mr-1" /> Asc
                      </Button>
                      <Button 
                        variant={sortDirection === "desc" ? "primary" : "outline"} 
                        size="sm" 
                        className={cn("flex-1 h-8 text-xs", sortDirection === "desc" ? "bg-primary-600 text-white" : "")}
                        onClick={() => sortBy && onSortChange(sortBy, "desc")}
                      >
                        <AppIcon name="arrowDown" size="xs" className="mr-1" /> Desc
                      </Button>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}

          {actions && (
            <div className="flex items-center gap-2 border-l border-neutral-200 dark:border-neutral-700 pl-2 ml-1">
              {actions}
            </div>
          )}
        </div>
      </div>

      {/* Filter Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800/50">
          <span className="text-[10px] font-semibold text-neutral-400 mr-1 uppercase tracking-wider">Active filters:</span>
          {searchQuery && (
            <Badge variant="secondary" className="pl-3 pr-1 h-6 rounded-full flex items-center gap-1 font-normal text-xs bg-neutral-100 dark:bg-neutral-800">
              <span className="text-neutral-500">Search:</span> {searchQuery}
              <div
                role="button"
                className="h-4 w-4 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center justify-center cursor-pointer ml-1 transition-colors"
                onClick={() => {
                  setLocalSearch("")
                  onSearchChange("")
                  setIsSearchExpanded(false)
                }}
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
                  <Badge key={`${filter.key}-${v}`} variant="secondary" className="pl-3 pr-1 h-6 rounded-full flex items-center gap-1 font-normal text-xs bg-neutral-100 dark:bg-neutral-800">
                    <span className="text-neutral-500">{filter.label}:</span> {optLabel}
                    <div
                      role="button"
                      className="h-4 w-4 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center justify-center cursor-pointer ml-1 transition-colors"
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
                  <Badge key={filter.key} variant="secondary" className="pl-3 pr-1 h-6 rounded-full flex items-center gap-1 font-normal text-xs bg-neutral-100 dark:bg-neutral-800">
                    <span className="text-neutral-500">{filter.label}:</span> {label}
                    <div
                      role="button"
                      className="h-4 w-4 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center justify-center cursor-pointer ml-1 transition-colors"
                      onClick={() => filter.onChange({ from: undefined, to: undefined })}
                    >
                      <AppIcon name="close" size="xs" />
                    </div>
                  </Badge>
                )
              }
              const optLabel = filter.options?.find((o) => o.value === filter.value)?.label || filter.value
              return (
                <Badge key={filter.key} variant="secondary" className="pl-3 pr-1 h-6 rounded-full flex items-center gap-1 font-normal text-xs bg-neutral-100 dark:bg-neutral-800">
                  <span className="text-neutral-500">{filter.label}:</span> {optLabel}
                  <div
                    role="button"
                    className="h-4 w-4 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center justify-center cursor-pointer ml-1 transition-colors"
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
