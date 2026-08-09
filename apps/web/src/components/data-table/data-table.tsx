"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  SortingState,
  getSortedRowModel,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  fetchNextPage?: () => void;
  isFetchingNextPage?: boolean;
  hasNextPage?: boolean;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  fetchNextPage,
  isFetchingNextPage,
  hasNextPage,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const tableContainerRef = React.useRef<HTMLDivElement>(null);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  });

  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: hasNextPage ? rows.length + 1 : rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 48,
    overscan: 5,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();

  React.useEffect(() => {
    const [lastItem] = [...virtualRows].reverse();
    if (!lastItem) return;

    if (
      lastItem.index >= rows.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage &&
      fetchNextPage
    ) {
      fetchNextPage();
    }
  }, [hasNextPage, fetchNextPage, rows.length, isFetchingNextPage, virtualRows]);

  return (
    <div className="rounded-md border bg-surface">
      <div
        ref={tableContainerRef}
        className="h-[600px] overflow-auto thin-scrollbar relative"
      >
        <Table>
          <TableHeader className="sticky top-0 bg-surface z-10 shadow-e1">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              position: "relative",
            }}
          >
            {virtualRows.length ? (
              virtualRows.map((virtualRow) => {
                const isLoaderRow = virtualRow.index > rows.length - 1;
                const row = rows[virtualRow.index];

                return (
                  <TableRow
                    key={virtualRow.index}
                    data-state={row?.getIsSelected() && "selected"}
                    className="absolute w-full flex border-b transition-none"
                    style={{
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    {isLoaderRow ? (
                      <TableCell colSpan={columns.length} className="h-12 flex items-center justify-center w-full">
                        Loading more...
                      </TableCell>
                    ) : (
                      row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="flex-1 flex items-center">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))
                    )}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center absolute w-full flex items-center justify-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
