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
import { Settings2, Pencil, Check, X as XIcon } from "lucide-react"

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
  onRowSelectionChange?: (rowSelection: RowSelectionState) => void
  onInlineEditSave?: (rowId: string, columnId: string, value: any) => void
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
          "align-middle transition-colors group-hover:bg-muted/50 data-[state=selected]:bg-muted",
          density === "compact" ? "p-2" : "p-4",
          stickyFirstCol && isFirstCol ? "sticky left-0 z-10 bg-background" : "",
          editable ? "group/cell relative" : ""
        )}
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
              <Check className="h-3 w-3 text-green-600" />
            </Button>
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleCancel}>
              <XIcon className="h-3 w-3 text-destructive" />
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
                <Pencil className="h-3 w-3" />
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
  onRowSelectionChange,
  onInlineEditSave,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Include checkbox column automatically if rowSelection is needed
  const tableColumns = useMemo(() => {
    if (!onRowSelectionChange) return columns
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
    onRowSelectionChange: setRowSelection,
    getRowId: getRowId || defaultGetRowId,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
    },
  })

  // Notify parent of selection changes
  useEffect(() => {
    if (onRowSelectionChange) {
      onRowSelectionChange(rowSelection)
    }
  }, [rowSelection, onRowSelectionChange])

  // Virtualization setup
  const tableContainerRef = useRef<HTMLDivElement>(null)
  const { rows } = table.getRowModel()
  
  const desktopRowHeight = density === "compact" ? 40 : 64
  const estimatedCardHeight = 200 // approximate height for mobile card
  const rowHeight = isMobile ? estimatedCardHeight : desktopRowHeight

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: useCallback(() => rowHeight, [rowHeight]),
    overscan: 10,
  })

  const virtualRows = rowVirtualizer.getVirtualItems()

  // Infinite Scroll / Cursor Pagination
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.target as HTMLDivElement
      const bottom = target.scrollHeight - target.scrollTop === target.clientHeight
      if (bottom && hasNextPage && !isFetchingNextPage && fetchNextPage) {
        fetchNextPage()
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  )

  return (
    <div className="space-y-4">
      {/* Table Toolbar */}
      <div className="flex items-center justify-between">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="ml-auto flex items-center gap-2">
              <Settings2 className="h-4 w-4" />
              View
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[150px]">
            {table
              .getAllColumns()
              .filter((column) => typeof column.accessorFn !== "undefined" && column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
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

      {/* Table Container with Virtualization */}
      <div
        ref={tableContainerRef}
        onScroll={handleScroll}
        className="rounded-md border bg-background relative h-[600px] overflow-auto"
      >
        {!isMobile ? (
          <table className="w-full caption-bottom text-sm grid">
            <thead
              className={cn(
                "[&_tr]:border-b grid",
                stickyHeader ? "sticky top-0 z-20 bg-muted/50 backdrop-blur" : ""
              )}
            >
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="flex w-full">
                  {headerGroup.headers.map((header, index) => {
                    return (
                      <th
                        key={header.id}
                        className={cn(
                          "h-12 px-4 text-left align-middle font-medium text-muted-foreground",
                          stickyFirstCol && index === 0 ? "sticky left-0 z-30 bg-muted/50" : ""
                        )}
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
            <tbody
              className="relative grid w-full"
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
              }}
            >
              {virtualRows.length > 0 ? (
                virtualRows.map((virtualRow) => {
                  const row = rows[virtualRow.index]
                  return (
                    <MemoizedRow
                      key={row.id}
                      row={row}
                      virtualRow={virtualRow}
                      density={density}
                      stickyFirstCol={stickyFirstCol}
                      onInlineEditSave={onInlineEditSave}
                    />
                  )
                })
              ) : (
                <tr>
                  <td colSpan={columns.length} className="h-24 text-center align-middle">
                    No results.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        ) : (
          <div
            className="relative w-full p-4"
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
            }}
          >
            {virtualRows.length > 0 ? (
              virtualRows.map((virtualRow) => {
                const row = rows[virtualRow.index]
                return (
                  <div
                    key={row.id}
                    className="absolute left-4 right-4 rounded-lg border bg-card p-4 text-card-foreground shadow-sm space-y-3"
                    style={{
                      top: 0,
                      transform: `translateY(${virtualRow.start}px)`,
                      // allow dynamic height by not forcing it if possible, but virtualizer requires explicit height or dynamic measurement
                    }}
                    ref={rowVirtualizer.measureElement}
                    data-index={virtualRow.index}
                  >
                    {row.getVisibleCells().map((cell) => {
                      // skip select column header text if it's the checkbox
                      const headerTitle = cell.column.id === "select" ? "" : cell.column.columnDef.header
                      return (
                        <div key={cell.id} className="flex flex-col gap-1 border-b border-border/50 pb-2 last:border-0 last:pb-0">
                          {headerTitle && (
                            <span className="text-xs font-medium text-muted-foreground">
                              {typeof headerTitle === "string" ? headerTitle : cell.column.id}
                            </span>
                          )}
                          <span className="text-sm">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )
              })
            ) : (
              <div className="h-24 flex items-center justify-center text-muted-foreground">
                No results.
              </div>
            )}
          </div>
        )}
        {isFetchingNextPage && (
          <div className="p-4 text-center text-sm text-muted-foreground">Loading more...</div>
        )}
      </div>
    </div>
  )
}
