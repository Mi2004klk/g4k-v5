"use client"

import React, { useCallback, useMemo, useState, useRef, useEffect } from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
  VisibilityState,
  RowSelectionState,
  RowData,
} from "@tanstack/react-table"
import { AppIcon } from "./icon/AppIcon";
import { useIsMobile } from "../hooks/use-mobile"

import { cn } from "../utils/cn"
import { Button } from "./button"
import { Checkbox } from "./checkbox"
import { Input } from "./input"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "./dropdown-menu"
import { Pagination } from "./pagination"
import { EmptyState } from "./empty-state"
import { Skeleton } from "./skeleton"

// Module augmentation: extend ColumnMeta with custom fields used by DataTable
declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    align?: "left" | "center" | "right"
    editable?: boolean
  }
}

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  getRowId?: (originalRow: TData, index: number, parent?: any) => string
  fetchNextPage?: () => void
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  /**
   * Column Hierarchy Best Practice:
   * 1. Identity (Name, ID, Avatar)
   * 2. Status / State (Badges)
   * 3. Dates / Metrics (Created At, Amounts)
   * 4. Actions (Dropdown menu at the end)
   */
  density?: "comfortable" | "compact"
  stickyHeader?: boolean
  stickyFirstCol?: boolean
  rowSelection?: RowSelectionState
  onRowSelectionChange?: (rowSelection: RowSelectionState) => void
  onRowClick?: (row: any) => void
  onInlineEditSave?: (rowId: string, columnId: string, value: any) => void
  page?: number
  perPage?: number
  totalPages?: number
  onPageChange?: (page: number) => void
  onPerPageChange?: (perPage: number) => void
  sorting?: SortingState
  onSortingChange?: (sorting: SortingState) => void
  isLoading?: boolean
  isError?: boolean
  skeletonRows?: number
  className?: string
  emptyState?: React.ReactNode
}

// Memoized individual cell to prevent re-rendering all cells when one changes or during scroll
const MemoizedCell = React.memo(
  ({
    cell,
    density,
    stickyFirstCol,
    isFirstCol,
    onInlineEditSave,
  }: {
    cell: any
    density: string
    stickyFirstCol: boolean
    isFirstCol: boolean
    onInlineEditSave?: (rowId: string, columnId: string, value: any) => void
  }) => {
    const [isEditing, setIsEditing] = useState(false)
    const [editValue, setEditValue] = useState(cell.getValue() as string)
    const inputRef = useRef<HTMLInputElement>(null)

    const editable = cell.column.columnDef.meta?.editable

    const handleEditStart = useCallback(() => {
      if (!editable) return
      setIsEditing(true)
    }, [editable])

    const handleSave = useCallback(() => {
      setIsEditing(false)
      if (onInlineEditSave && editValue !== cell.getValue()) {
        onInlineEditSave(cell.row.id, cell.column.id, editValue)
      }
    }, [editValue, cell.getValue, onInlineEditSave, cell.row.id, cell.column.id])

    const handleCancel = useCallback(() => {
      setIsEditing(false)
      setEditValue(cell.getValue() as string)
    }, [cell.getValue])

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleSave()
        if (e.key === "Escape") handleCancel()
      },
      [handleSave, handleCancel]
    )

    useEffect(() => {
      if (isEditing && inputRef.current) {
        inputRef.current.focus()
      }
    }, [isEditing])

    return (
      <td
        className={cn(
          "align-middle transition-colors group-hover:bg-muted/50 data-[state=selected]:bg-muted flex-1",
          density === "compact" ? "p-2" : "p-4",
          stickyFirstCol && isFirstCol ? "sticky left-0 z-10 bg-background" : "",
          editable ? "group/cell relative" : ""
        )}
        style={{ width: cell.column.getSize(), flex: `1 1 ${cell.column.getSize()}px` }}
      >
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Input
              ref={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-7 text-xs"
            />
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleSave}>
              <AppIcon name="check" size="xs" className=" text-green-600" />
            </Button>
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleCancel}>
              <AppIcon name="close" size="xs" className=" text-destructive" />
            </Button>
          </div>
        ) : (
          <div className={cn("flex items-center", cell.column.columnDef.meta?.align === 'right' ? "justify-end" : "justify-between")}>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
            {editable && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover/cell:opacity-100 transition-opacity"
                onClick={handleEditStart}
              >
                <AppIcon name="edit" size="xs" />
              </Button>
            )}
          </div>
        )}
      </td>
    )
  }
)
MemoizedCell.displayName = "MemoizedCell"

export function DataTable<TData, TValue>({
  columns,
  data,
  getRowId,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  density = "comfortable",
  stickyHeader = true,
  stickyFirstCol = true,
  rowSelection: externalRowSelection,
  onRowSelectionChange,
  onRowClick,
  onInlineEditSave,
  page,
  perPage,
  totalPages,
  onPageChange,
  onPerPageChange,
  sorting: externalSorting,
  onSortingChange,
  isLoading,
  isError,
  skeletonRows = 5,
  className,
}: DataTableProps<TData, TValue>) {
  const [internalSorting, setInternalSorting] = useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [internalRowSelection, setInternalRowSelection] = useState<RowSelectionState>({})
  const [densityMode, setDensityMode] = useState<"comfortable" | "compact">(density)
  const isMobile = useIsMobile()

  // Include checkbox column automatically if rowSelection is needed and not already present
  const tableColumns = useMemo(() => {
    if (!onRowSelectionChange) return columns
    const hasSelect = columns.some((c: any) => c.id === "select")
    if (hasSelect) return columns

    const selectColumn: ColumnDef<TData, any> = {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() ? "indeterminate" : false)}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    }
    return [selectColumn, ...columns]
  }, [columns, onRowSelectionChange])

  const defaultGetRowId = useCallback((row: TData, index: number) => String(index), [])

  const table = useReactTable({
    data,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: (updaterOrValue) => {
      const newValue = typeof updaterOrValue === 'function' ? updaterOrValue(externalSorting !== undefined ? externalSorting : internalSorting) : updaterOrValue;
      setInternalSorting(newValue);
      onSortingChange?.(newValue);
    },
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: (updaterOrValue) => {
      const newValue = typeof updaterOrValue === 'function' ? updaterOrValue(internalRowSelection) : updaterOrValue;
      setInternalRowSelection(newValue);
      onRowSelectionChange?.(newValue);
    },
    getRowId: getRowId || defaultGetRowId,
    state: {
      sorting: externalSorting !== undefined ? externalSorting : internalSorting,
      columnVisibility,
      rowSelection: externalRowSelection !== undefined ? externalRowSelection : internalRowSelection,
    },
  })

  // Expose sorting to parent initially if internal
  useEffect(() => {
    if (onSortingChange && externalSorting === undefined) {
      onSortingChange(internalSorting);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [internalSorting, onSortingChange]);

  const tableContainerRef = useRef<HTMLDivElement>(null)
  const { rows } = table.getRowModel()

  // Infinite Scroll / Cursor Pagination
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      if (page !== undefined) return;
      
      const target = e.target as HTMLDivElement
      const bottom = target.scrollHeight - target.scrollTop === target.clientHeight
      if (bottom && hasNextPage && !isFetchingNextPage && fetchNextPage) {
        fetchNextPage()
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage, page]
  )

  const effectiveColumnsCount = table.getVisibleFlatColumns().length

  return (
    <div className={cn("space-y-3 w-full flex flex-col h-full", className)} data-density={densityMode}>
      {/* Table Toolbar */}
      <div className="flex items-center justify-end shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 text-xs flex items-center gap-1.5 border-border/70 shadow-2xs">
              <AppIcon name="sliders" size="xs" />
              View
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[160px]">
            <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Density
            </div>
            <DropdownMenuCheckboxItem
              className="text-xs"
              checked={densityMode === "comfortable"}
              onCheckedChange={() => setDensityMode("comfortable")}
            >
              Comfortable
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              className="text-xs"
              checked={densityMode === "compact"}
              onCheckedChange={() => setDensityMode("compact")}
            >
              Compact
            </DropdownMenuCheckboxItem>
            <div className="my-1 h-px bg-border/50" />
            <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Columns
            </div>
            {table
              .getAllColumns()
              .filter((column) => typeof column.accessorFn !== "undefined" && column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize text-xs"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id.replace(/_/g, " ")}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table Container */}
      <div
        ref={tableContainerRef}
        onScroll={handleScroll}
        className="rounded-xl border border-border/80 bg-card shadow-2xs overflow-auto flex-1 min-h-0"
        aria-busy={isLoading}
      >
        {!isMobile ? (
            <table className="w-full min-w-[800px] text-sm text-left border-collapse">
              <thead
                className={cn(
                  "border-b border-border/80 bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider",
                  stickyHeader ? "sticky top-0 z-20 backdrop-blur-md" : ""
                )}
              >
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header, index) => {
                      const isSortable = header.column.getCanSort();
                      const sortedState = header.column.getIsSorted();
                      
                      return (
                        <th
                          key={header.id}
                          className={cn(
                            "h-[var(--density-row-height)] px-[var(--density-padding)] align-middle text-muted-foreground whitespace-nowrap",
                            stickyFirstCol && index === 0 ? "sticky left-0 z-30 bg-muted/60" : "",
                            isSortable ? "cursor-pointer select-none hover:text-foreground hover:bg-muted/60 transition-colors" : "",
                            header.column.columnDef.meta?.align === 'right' ? "text-right" : ""
                          )}
                          style={header.getSize() !== 150 ? { width: header.getSize() } : undefined}
                          onClick={isSortable ? header.column.getToggleSortingHandler() : undefined}
                          aria-sort={sortedState === 'asc' ? 'ascending' : sortedState === 'desc' ? 'descending' : 'none'}
                        >
                          {header.isPlaceholder
                            ? null
                            : (
                              <div className="flex items-center gap-1.5">
                                {flexRender(header.column.columnDef.header, header.getContext())}
                                {isSortable && (
                                  <span className="flex items-center justify-center text-[10px] w-3 opacity-70">
                                    {sortedState === 'asc' ? '▲' : sortedState === 'desc' ? '▼' : '↕'}
                                  </span>
                                )}
                              </div>
                            )}
                        </th>
                      )
                    })}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-border/60 bg-background">
                {isLoading ? (
                  Array.from({ length: skeletonRows }).map((_, rIdx) => (
                    <tr key={`skel-row-${rIdx}`} className="animate-pulse">
                      {tableColumns.map((col, cIdx) => (
                        <td key={`skel-cell-${cIdx}`} className={cn("p-4", densityMode === "compact" ? "py-2 px-3" : "py-3.5 px-4")}>
                          <Skeleton className="h-4 w-3/4 rounded" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : isError ? (
                  <tr>
                    <td colSpan={effectiveColumnsCount} className="py-12 px-4 text-center">
                      <div className="flex justify-center w-full">
                        <EmptyState
                          title="Failed to load data"
                          description="There was an error fetching the records. Please try again."
                          icon={<AppIcon name="error" size="2xl" className="text-destructive" />}
                          className="max-w-md mx-auto"
                        />
                      </div>
                    </td>
                  </tr>
                ) : rows.length > 0 ? (
                  rows.map((row) => (
                    <tr
                      id={`data-row-${(row.original as any)?.id || row.id}`}
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      className={cn(
                        "group transition-colors hover:bg-muted/40 data-[state=selected]:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset",
                        onRowClick ? "cursor-pointer" : ""
                      )}
                      tabIndex={row.getCanSelect() ? 0 : undefined}
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                      onKeyDown={(e) => {
                        if (row.getCanSelect() && (e.key === 'Enter' || e.key === ' ')) {
                          e.preventDefault();
                          row.toggleSelected();
                        } else if (onRowClick && e.key === 'Enter') {
                          e.preventDefault();
                          onRowClick(row);
                        }
                      }}
                    >
                      {row.getVisibleCells().map((cell, index) => (
                        <td
                          key={cell.id}
                          className={cn(
                            "align-middle transition-colors h-[var(--density-row-height)] px-[var(--density-padding)]",
                            densityMode === "compact" ? "text-xs" : "text-sm",
                            stickyFirstCol && index === 0 ? "sticky left-0 z-10 bg-background group-hover:bg-muted/40" : "",
                            cell.column.columnDef.meta?.align === 'right' ? "text-right" : ""
                          )}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={effectiveColumnsCount} className="py-12 px-4 text-center">
                      <div className="flex justify-center w-full">
                        <EmptyState
                          title="No records found"
                          description="Try adjusting your filters or search query."
                          className="max-w-md mx-auto"
                        />
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
        ) : (
          <div className="w-full p-3 space-y-3">
            {isLoading ? (
              Array.from({ length: skeletonRows }).map((_, rIdx) => (
                <div key={`skel-m-row-${rIdx}`} className="rounded-[var(--radius)] border border-border bg-card p-4 space-y-2 animate-pulse">
                  <Skeleton className="h-4 w-1/2 rounded" />
                  <Skeleton className="h-3 w-3/4 rounded" />
                </div>
              ))
            ) : rows.length > 0 ? (
              rows.map((row) => (
                <div
                  key={row.id}
                  className="rounded-[var(--radius)] border border-border bg-card p-4 text-card-foreground shadow-2xs space-y-2.5"
                >
                  {row.getVisibleCells().map((cell) => {
                    const headerTitle = cell.column.id === "select" ? "" : cell.column.columnDef.header
                    return (
                      <div key={cell.id} className="flex flex-col gap-1 border-b border-border/40 pb-2 last:border-0 last:pb-0 overflow-hidden">
                        {headerTitle && (
                          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider truncate">
                            {typeof headerTitle === "string" ? headerTitle : cell.column.id}
                          </span>
                        )}
                        <span className="text-sm break-words">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </span>
                      </div>
                    )
                  })}
                </div>
              ))
            ) : (
              <div className="py-10">
                {emptyState || (
                  <EmptyState
                    title="No records found"
                    description="Try adjusting your filters or search query."
                    className="max-w-md mx-auto"
                  />
                )}
              </div>
            )}
          </div>
        )}
        {isFetchingNextPage && (
          <div className="p-4 text-center text-xs font-medium text-muted-foreground animate-pulse">Loading more records...</div>
        )}
      </div>

      {page !== undefined && totalPages !== undefined && (
        <Pagination
          variant="standard"
          currentPage={page}
          totalPages={totalPages}
          pageSize={perPage}
          hasNextPage={page < totalPages}
          hasPreviousPage={page > 1}
          onNextPage={() => onPageChange?.(page + 1)}
          onPreviousPage={() => onPageChange?.(page - 1)}
          onPageSizeChange={onPerPageChange}
        />
      )}
    </div>
  )
}
