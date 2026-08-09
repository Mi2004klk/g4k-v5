import * as React from "react"
import { Search, X } from "lucide-react"
import { Input } from "@g4k/ui/components"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@g4k/ui/components"
import { Button } from "@g4k/ui/components"

export interface FilterOption {
  key: string
  label: string
  options: { label: string; value: string }[]
  value: string
  onChange: (value: string) => void
}

interface FilterBarProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  filters?: FilterOption[]
}

export function FilterBar({
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Search...",
  filters = [],
}: FilterBarProps) {
  const hasActiveFilters = filters.some((f) => f.value && f.value !== "all") || searchQuery.length > 0

  const handleClearAll = () => {
    onSearchChange("")
    filters.forEach((f) => {
      f.onChange("all")
    })
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
      <div className="relative flex-1 w-full sm:max-w-xs">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
        <Input
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-9"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-2.5 top-2.5 h-4 w-4 text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {filters.map((filter) => (
        <Select
          key={filter.key}
          value={filter.value}
          onValueChange={filter.onChange}
        >
          <SelectTrigger className="h-9 w-full sm:w-[150px]">
            <SelectValue placeholder={filter.label} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All {filter.label}s</SelectItem>
            {filter.options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}

      {hasActiveFilters && (
        <Button
          variant="ghost"
          onClick={handleClearAll}
          className="h-9 px-3 text-neutral-500 hover:text-neutral-900"
        >
          Reset
        </Button>
      )}
    </div>
  )
}
