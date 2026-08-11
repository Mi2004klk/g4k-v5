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
import { cn } from "../utils/cn"

export interface FilterOption {
  key: string
  label: string
  type?: "select" | "combobox" | "checkbox-group" | "date-range"
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
        // For simplicity in a bar, a dropdown containing checkboxes is best
        return (
          <Select>
            <SelectTrigger className="w-full sm:w-[150px] h-9">
              <SelectValue placeholder={`${filter.label} (${Array.isArray(filter.value) ? filter.value.length : 0})`} />
            </SelectTrigger>
            <SelectContent>
              <div className="p-2 space-y-2">
                {filter.options?.map((opt) => {
                  const isChecked = Array.isArray(filter.value) && filter.value.includes(opt.value)
                  return (
                    <label key={opt.value} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={(checked) => {
                          const current = Array.isArray(filter.value) ? filter.value : []
                          if (checked) filter.onChange([...current, opt.value])
                          else filter.onChange(current.filter((v: string) => v !== opt.value))
                        }}
                      />
                      {opt.label}
                    </label>
                  )
                })}
              </div>
            </SelectContent>
          </Select>
        )
      case "date-range":
        // Fallback simple date inputs if no complex DatePicker is available yet
        return (
          <div className="flex items-center gap-2">
            <Input
              type="date"
              className="h-9 w-full sm:w-[130px]"
              value={filter.value?.start || ""}
              onChange={(e) => filter.onChange({ ...filter.value, start: e.target.value })}
            />
            <span className="text-muted-foreground">-</span>
            <Input
              type="date"
              className="h-9 w-full sm:w-[130px]"
              value={filter.value?.end || ""}
              onChange={(e) => filter.onChange({ ...filter.value, end: e.target.value })}
            />
          </div>
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
