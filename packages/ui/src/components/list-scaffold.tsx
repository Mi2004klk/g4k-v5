"use client";

import React from "react";
import { FilterBar, FilterOption } from "./filter-bar";
import { DataTable } from "./data-table";
import { Pagination } from "./pagination";
import { Button } from "./button";
import { AppIcon } from "./icon/AppIcon";
import { ColumnDef } from "@tanstack/react-table";
import { useBreakpoint } from "../hooks/use-breakpoint";

export interface ListScaffoldProps<TData, TValue> {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  
  // FilterBar Props
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  hideSearch?: boolean;
  filters?: FilterOption[];
  onClearAll?: () => void;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  onSortChange?: (sortBy: string, direction: "asc" | "desc") => void;
  sortOptions?: { label: string; value: string }[];
  hideToolbar?: boolean;

  // Bulk Actions
  bulkActions?: React.ReactNode;
  
  // DataTable Props
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  getRowId?: (row: TData, index: number) => string;
  onRowClick?: (row: TData) => void;
  rowSelection?: Record<string, boolean>;
  onRowSelectionChange?: (selection: any) => void;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  
  // Pagination
  pagination?: {
    page: number;
    perPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onPerPageChange?: (perPage: number) => void;
  };

  // Rendering
  emptyState?: React.ReactNode;
  mobileCardRenderer?: (row: TData) => React.ReactNode;
}

export function ListScaffold<TData, TValue>({
  title,
  description,
  actions,
  searchQuery,
  onSearchChange,
  searchPlaceholder,
  hideSearch,
  filters,
  onClearAll,
  sortBy,
  sortDirection,
  onSortChange,
  sortOptions,
  hideToolbar,
  bulkActions,
  columns,
  data,
  getRowId,
  onRowClick,
  rowSelection,
  onRowSelectionChange,
  isLoading,
  isError,
  onRetry,
  pagination,
  emptyState,
  mobileCardRenderer,
}: ListScaffoldProps<TData, TValue>) {
  const selectedCount = rowSelection ? Object.keys(rowSelection).filter(k => rowSelection[k]).length : 0;
  const hasSelection = selectedCount > 0;
  const { isMobile } = useBreakpoint();

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>

      {/* Bulk Actions or Toolbar */}
      {!hideToolbar && (
        <div className="min-h-[52px]">
          {hasSelection && bulkActions ? (
            <div className="flex items-center justify-between bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl px-4 py-2 animate-in slide-in-from-top-2">
              <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                {selectedCount} selected
              </span>
              <div className="flex items-center gap-2">
                {bulkActions}
              </div>
            </div>
          ) : (
            <FilterBar
              searchQuery={searchQuery}
              onSearchChange={onSearchChange}
              searchPlaceholder={searchPlaceholder}
              hideSearch={hideSearch}
              filters={filters}
              onClearAll={onClearAll}
              sortBy={sortBy}
              sortDirection={sortDirection}
              onSortChange={onSortChange}
              sortOptions={sortOptions}
            />
          )}
        </div>
      )}

      {/* Data Table */}
      <div className="flex-1 min-h-0 bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 flex flex-col">
        <div className="flex-1 overflow-auto">
          {isError ? (
            <div className="flex flex-col items-center justify-center p-8 h-full text-center">
              <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mb-4 text-rose-600 dark:text-rose-400">
                <AppIcon name="error" size="lg" />
              </div>
              <h3 className="text-base font-semibold mb-1">Failed to load data</h3>
              <p className="text-sm text-neutral-500 mb-4 max-w-sm">
                There was a problem communicating with the server. Please check your connection and try again.
              </p>
              {onRetry && (
                <Button onClick={onRetry} variant="outline" size="sm">
                  <AppIcon name="refresh" className="mr-2 h-4 w-4" /> Try Again
                </Button>
              )}
            </div>
          ) : (
            isMobile && mobileCardRenderer ? (
              <div className="space-y-3 p-4 flex-1 overflow-auto">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex gap-4 p-4 border border-neutral-200 dark:border-neutral-800 rounded-xl animate-pulse bg-neutral-50 dark:bg-neutral-800/50">
                      <div className="h-4 w-1/4 rounded bg-neutral-200 dark:bg-neutral-700" />
                      <div className="h-4 w-1/2 rounded bg-neutral-200 dark:bg-neutral-700" />
                    </div>
                  ))
                ) : data.length === 0 ? (
                  emptyState || (
                    <div className="flex flex-col items-center justify-center py-12 text-neutral-500">
                      No data found.
                    </div>
                  )
                ) : (
                  data.map((row, i) => (
                    <div key={getRowId ? getRowId(row, i) : i} onClick={() => onRowClick?.(row)}>
                      {mobileCardRenderer(row)}
                    </div>
                  ))
                )}
                {pagination && data.length > 0 && (
                  <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 mt-4">
                    <Pagination 
                      variant="standard"
                      currentPage={pagination.page}
                      totalPages={pagination.totalPages}
                      pageSize={pagination.perPage}
                      hasNextPage={pagination.page < pagination.totalPages}
                      hasPreviousPage={pagination.page > 1}
                      onNextPage={() => pagination.onPageChange(pagination.page + 1)}
                      onPreviousPage={() => pagination.onPageChange(pagination.page - 1)}
                      onPageSizeChange={pagination.onPerPageChange}
                    />
                  </div>
                )}
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={data}
                getRowId={getRowId}
                onRowClick={onRowClick}
                rowSelection={rowSelection}
                onRowSelectionChange={onRowSelectionChange}
                isLoading={isLoading}
                emptyState={emptyState}
                {...(pagination ? {
                  page: pagination.page,
                  perPage: pagination.perPage,
                  totalPages: pagination.totalPages,
                  onPageChange: pagination.onPageChange,
                  onPerPageChange: pagination.onPerPageChange
                } : {})}
              />
            )
          )}
        </div>
      </div>
    </div>
  );
}
