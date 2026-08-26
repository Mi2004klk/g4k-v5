"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { apiFetch } from "@/lib/api-client";
import { ListScaffold } from "@g4k/ui/components";
import { AppIcon } from "@g4k/ui/components";

import { useUrlState } from "@/hooks/use-url-state";

export interface LoginAttemptUser {
  id: number;
  name: string;
}

export interface LoginAttemptRow {
  id: number;
  identifier: string;
  user?: LoginAttemptUser;
  ip_address: string;
  location: string | null;
  user_agent: string;
  success: boolean;
  is_suspicious: boolean;
  created_at: string;
}

export function LoginAttemptsTable() {
  const [identifier, setIdentifier] = useUrlState("identifier", "");
  const [status, setStatus] = useUrlState("status", "");
  const [ipAddress, setIpAddress] = useUrlState("ip_address", "");
  const [startDate, setStartDate] = useUrlState("start_date", "");
  const [endDate, setEndDate] = useUrlState("end_date", "");
  const filters = { identifier, status, ip_address: ipAddress, start_date: startDate, end_date: endDate };
  
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  
  const { data: attemptsData, isLoading, isError } = useQuery({
    queryKey: ['login-attempts', filters, page, perPage],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters.identifier) params.append("identifier", filters.identifier);
      if (filters.status) params.append("status", filters.status);
      if (filters.ip_address) params.append("ip_address", filters.ip_address);
      if (filters.start_date) params.append("start_date", filters.start_date);
      if (filters.end_date) params.append("end_date", filters.end_date);
      params.append("page", page.toString());
      params.append("per_page", perPage.toString());
      return apiFetch(`/auth/login-attempts?${params.toString()}`);
    }
  });

  const attempts = attemptsData?.data || [];
  const totalPages = attemptsData?.last_page || 1;

  const columns = [
    {
      accessorKey: "created_at",
      header: "Timestamp",
      cell: ({ row }: { row: { original: LoginAttemptRow } }) => format(new Date(row.original.created_at), "MMM d, yyyy HH:mm:ss")
    },
    {
      accessorKey: "identifier",
      header: "Identifier / User",
      cell: ({ row }: { row: { original: LoginAttemptRow } }) => (
        <div className="flex flex-col">
          <span className="font-medium text-sm">{row.original.user ? row.original.user.name : row.original.identifier}</span>
          {!row.original.user && <span className="text-xs text-neutral-500">Unresolved User</span>}
        </div>
      )
    },
    {
      accessorKey: "network",
      header: "Network",
      cell: ({ row }: { row: { original: LoginAttemptRow } }) => (
        <div className="flex flex-col">
          <span className="text-neutral-600 dark:text-neutral-300 font-mono text-[11px]">{row.original.ip_address}</span>
          {row.original.location && <span className="text-neutral-500 text-[10px] truncate max-w-[150px]">{row.original.location}</span>}
        </div>
      )
    },
    {
      accessorKey: "device",
      header: "Device",
      cell: ({ row }: { row: { original: LoginAttemptRow } }) => (
        <span className="text-neutral-500 text-xs truncate max-w-[200px]" title={row.original.user_agent}>
          {row.original.user_agent || "-"}
        </span>
      )
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: { row: { original: LoginAttemptRow } }) => {
        if (row.original.is_suspicious) {
          return (
            <span className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/30 px-2 py-0.5 rounded text-[11px] font-medium inline-flex items-center gap-1">
              <AppIcon name="warning" size="sm" /> Suspicious
            </span>
          );
        }
        if (row.original.success) {
          return (
            <span className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/30 px-2 py-0.5 rounded text-[11px] font-medium">
              Success
            </span>
          );
        }
        return (
          <span className="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700 px-2 py-0.5 rounded text-[11px] font-medium">
            Failed
          </span>
        );
      }
    }
  ];

  return (
    <ListScaffold
      hideSearch={true}
        filters={[
          {
            key: "status",
            label: "Status",
            type: "select",
            options: [
              { label: "All Statuses", value: "" },
              { label: "Success", value: "success" },
              { label: "Failed", value: "failed" },
              { label: "Suspicious", value: "suspicious" },
            ],
            value: filters.status,
            onChange: (v) => setStatus(v as string)
          },
          {
            key: "date_range",
            label: "Date Range",
            type: "date-range",
            value: { 
              from: filters.start_date ? new Date(filters.start_date) : undefined, 
              to: filters.end_date ? new Date(filters.end_date) : undefined 
            },
            onChange: (range: any) => {
              setStartDate(range?.from ? format(range.from, "yyyy-MM-dd") : "");
              setEndDate(range?.to ? format(range.to, "yyyy-MM-dd") : "");
            }
          }
        ]}
        columns={columns}
        data={attempts}
        isLoading={isLoading}
        isError={isError}
        pagination={{
          page,
          perPage,
          totalPages,
          onPageChange: setPage,
          onPerPageChange: setPerPage
        }}
        mobileCardRenderer={(attempt) => (
          <div className="flex flex-col gap-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {attempt.is_suspicious ? (
                  <span className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-2 py-0.5 rounded text-[10px] font-medium">
                    Suspicious
                  </span>
                ) : attempt.success ? (
                  <span className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-2 py-0.5 rounded text-[10px] font-medium">
                    Success
                  </span>
                ) : (
                  <span className="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 px-2 py-0.5 rounded text-[10px] font-medium">
                    Failed
                  </span>
                )}
                <span className="text-sm font-medium">{attempt.user ? attempt.user.name : attempt.identifier}</span>
              </div>
              <span className="text-[10px] text-neutral-500">{format(new Date(attempt.created_at), "MMM d, HH:mm")}</span>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 text-xs">
              <span className="text-neutral-400 font-mono text-[10px]">{attempt.ip_address}</span>
              <span className="text-neutral-500 text-[10px]">{attempt.location || "-"}</span>
            </div>
          </div>
        )}
    </ListScaffold>
  );
}
