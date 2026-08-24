"use client";

import React from "react";
import { Toolbar, FilterOption } from "./toolbar";
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
  
  // Toolbar Props
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
  toolbarActions?: React.ReactNode;

  // Bulk Actions
  bulkActions?: React.ReactNode;
  
  // View Toggle
  viewMode?: "list" | "grid";
  onViewModeChange?: (mode: "list" | "grid") => void;
  gridRenderer?: (row: TData) => React.ReactNode;
  
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
  toolbarActions,
  bulkActions,
  viewMode,
  onViewModeChange,
  gridRenderer,
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
            {viewMode && onViewModeChange && (
              <div className="flex bg-neutral-100 dark:bg-neutral-800 p-0.5 rounded-lg ml-2">
                <button
                  type="button"
                  onClick={() => onViewModeChange("list")}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-white" : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"}`}
                >
                  <AppIcon name="list" size="sm" />
                </button>
                <button
                  type="button"
                  onClick={() => onViewModeChange("grid")}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-white" : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"}`}
                >
                  <AppIcon name="grid" size="sm" />
                </button>
              </div>
            )}
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
            <Toolbar
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
              actions={toolbarActions}
            />
          )}
        </div>
      )}

      {/* Data Table */}
      <div className="flex-1 min-h-0 flex flex-col mt-2">
        <div className="flex-1 overflow-auto rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm relative">
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
                <div className="p-4 space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse flex space-x-4">
                      <div className="rounded-full bg-neutral-200 dark:bg-neutral-800 h-10 w-10"></div>
                      <div className="flex-1 space-y-2 py-1">
                        <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-3/4"></div>
                        <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : data.length === 0 ? (
                emptyState || (
                  <div className="flex items-center justify-center h-48 text-neutral-500">
                    No data found.
                  </div>
                )
              ) : viewMode === "grid" && gridRenderer ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
                  {data.map((row: any, i: number) => {
                    const id = getRowId ? getRowId(row, i) : String(i);
                    return <div key={id}>{gridRenderer(row)}</div>;
                  })}
                </div>
              ) : (
                <DataTable
                  columns={columns}
                  data={data}
                  getRowId={getRowId}
                  onRowClick={onRowClick}
                  rowSelection={rowSelection}
                  onRowSelectionChange={onRowSelectionChange}
                />
              )}
              </div>
            ) : (
              <div className="h-full flex flex-col">
                {isLoading ? (
                  <div className="p-4 space-y-4 flex-1">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse flex space-x-4">
                        <div className="rounded-full bg-neutral-200 dark:bg-neutral-800 h-10 w-10"></div>
                        <div className="flex-1 space-y-2 py-1">
                          <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-3/4"></div>
                          <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : data.length === 0 ? (
                  emptyState || (
                    <div className="flex items-center justify-center h-48 text-neutral-500">
                      No data found.
                    </div>
                  )
                ) : viewMode === "grid" && gridRenderer ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 p-6 overflow-y-auto flex-1">
                    {data.map((row: any, i: number) => {
                      const id = getRowId ? getRowId(row, i) : String(i);
                      return <div key={id}>{gridRenderer(row)}</div>;
                    })}
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto">
                    <DataTable
                      columns={columns}
                      data={data}
                      getRowId={getRowId}
                      onRowClick={onRowClick}
                      rowSelection={rowSelection}
                      onRowSelectionChange={onRowSelectionChange}
                      isLoading={isLoading}
                      emptyState={emptyState}
                    />
                  </div>
                )}
              </div>
            )
          )}
        </div>
        
        {/* Pagination below the rounded card container */}
        {pagination && data.length > 0 && (
          <div className="mt-6 flex justify-end px-2">
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
    </div>
  );
}
