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
} from "@tanstack/react-table"
import { useVirtualizer } from "@tanstack/react-virtual"
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

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  getRowId?: (originalRow: TData, index: number, parent?: any) => string
  fetchNextPage?: () => void
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  density?: "comfortable" | "compact"
  stickyHeader?: boolean
  stickyFirstCol?: boolean
  rowSelection?: RowSelectionState
  onRowSelectionChange?: (rowSelection: RowSelectionState) => void
  onInlineEditSave?: (rowId: string, columnId: string, value: any) => void
  page?: number
  perPage?: number
  totalPages?: number
  onPageChange?: (page: number) => void
  onPerPageChange?: (perPage: number) => void
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
          <div className="flex items-center justify-between">
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

// Memoized individual row for 60FPS scrolling
const MemoizedRow = React.memo(
  ({
    row,
    virtualRow,
    density,
    stickyFirstCol,
    onInlineEditSave,
  }: {
    row: any
    virtualRow: any
    density: string
    stickyFirstCol: boolean
    onInlineEditSave?: (rowId: string, columnId: string, value: any) => void
  }) => {
    return (
      <tr
        data-state={row.getIsSelected() && "selected"}
        className="group absolute flex w-full border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
        style={{
          top: 0,
          left: 0,
          transform: `translateY(${virtualRow.start}px)`,
          height: `${virtualRow.size}px`,
        }}
      >
        {row.getVisibleCells().map((cell: any, index: number) => (
          <MemoizedCell
            key={cell.id}
            cell={cell}
            density={density}
            stickyFirstCol={stickyFirstCol}
            isFirstCol={index === 0}
            onInlineEditSave={onInlineEditSave}
          />
        ))}
      </tr>
    )
  }
)
MemoizedRow.displayName = "MemoizedRow"

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
  onInlineEditSave,
  page,
  perPage,
  totalPages,
  onPageChange,
  onPerPageChange,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [internalRowSelection, setInternalRowSelection] = useState<RowSelectionState>({})
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
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: (updaterOrValue) => {
      const newValue = typeof updaterOrValue === 'function' ? updaterOrValue(internalRowSelection) : updaterOrValue;
      setInternalRowSelection(newValue);
      onRowSelectionChange?.(newValue);
    },
    getRowId: getRowId || defaultGetRowId,
    state: {
      sorting,
      columnVisibility,
      rowSelection: externalRowSelection !== undefined ? externalRowSelection : internalRowSelection,
    },
  })

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
    <div className="space-y-3 w-full">
      {/* Table Toolbar */}
      <div className="flex items-center justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 text-xs flex items-center gap-1.5 border-border/70 shadow-2xs">
              <AppIcon name="sliders" size="xs" />
              View
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[160px]">
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
                    {column.id}
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
        className="rounded-xl border border-border/80 bg-card shadow-2xs overflow-hidden"
      >
        {!isMobile ? (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-sm text-left border-collapse">
              <thead
                className={cn(
                  "border-b border-border/80 bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider",
                  stickyHeader ? "sticky top-0 z-20 backdrop-blur-md" : ""
                )}
              >
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header, index) => {
                      return (
                        <th
                          key={header.id}
                          className={cn(
                            "h-10 px-4 align-middle text-muted-foreground whitespace-nowrap",
                            stickyFirstCol && index === 0 ? "sticky left-0 z-30 bg-muted/60" : ""
                          )}
                          style={header.getSize() !== 150 ? { width: header.getSize() } : undefined}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      )
                    })}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-border/60 bg-background">
                {rows.length > 0 ? (
                  rows.map((row) => (
                    <tr
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      className="group transition-colors hover:bg-muted/40 data-[state=selected]:bg-primary/5"
                    >
                      {row.getVisibleCells().map((cell, index) => (
                        <td
                          key={cell.id}
                          className={cn(
                            "align-middle transition-colors",
                            density === "compact" ? "py-2 px-3 text-xs" : "py-3.5 px-4 text-sm",
                            stickyFirstCol && index === 0 ? "sticky left-0 z-10 bg-background group-hover:bg-muted/40" : ""
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
          </div>
        ) : (
          <div className="w-full p-3 space-y-3">
            {rows.length > 0 ? (
              rows.map((row) => (
                <div
                  key={row.id}
                  className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-2xs space-y-2.5"
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
                <EmptyState
                  title="No records found"
                  description="Try adjusting your filters or search query."
                  className="max-w-md mx-auto"
                />
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
