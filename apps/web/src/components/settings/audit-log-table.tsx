"use client";
import Link from "next/link";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { AppIcon } from "@g4k/ui/components";
import { apiFetch } from "@/lib/api-client";
import { toast } from "sonner";
import { Button } from "@g4k/ui/components";
import { ListScaffold } from "@g4k/ui/components";
import { DatePicker } from "@g4k/ui/components";

import { useUrlState } from "@/hooks/use-url-state";
import { queryKeys } from "@/lib/query-keys";
import { useExport } from "@/hooks/use-export";

export interface AuditLogUser {
  id: number;
  name: string;
}

export interface AuditLogRow {
  at: string;
  user?: AuditLogUser;
  action: string;
  subject_type?: string;
  subject_id?: number | string;
  ip?: string;
}

export function AuditLogTable() {
  const queryClient = useQueryClient();
  const [action, setAction] = useUrlState("action", "");
  const [userId, setUserId] = useUrlState("user_id", "");
  const [startDate, setStartDate] = useUrlState("start_date", "");
  const [endDate, setEndDate] = useUrlState("end_date", "");
  const filters = { action, user_id: userId, start_date: startDate, end_date: endDate };
  const { triggerExport, isExporting } = useExport();
  
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  const { data: usersResponse } = useQuery({
    queryKey: queryKeys.usersList,
    queryFn: () => apiFetch("/directory?per_page=100"),
  });
  const users = usersResponse?.data || [];
  const userOptions = [{ label: "All Users", value: "" }, { label: "System", value: "system" }].concat(
    users.map((u: AuditLogUser) => ({ label: u.name, value: String(u.id) }))
  );
  
  const { data: logsData, isLoading, isError } = useQuery({
    queryKey: [...queryKeys.auditLogs(filters), page, perPage],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters.action) params.append("action", filters.action);
      if (filters.user_id) params.append("user_id", filters.user_id);
      if (filters.start_date) params.append("start_date", filters.start_date);
      if (filters.end_date) params.append("end_date", filters.end_date);
      params.append("page", page.toString());
      params.append("per_page", perPage.toString());
      return apiFetch(`/audit-logs?${params.toString()}`);
    }
  });

  const logs = logsData?.data || [];
  const totalPages = logsData?.last_page || 1;

  const handleExport = async () => {
    const params = new URLSearchParams();
    if (filters.action) params.append("action", filters.action);
    if (filters.user_id) params.append("user_id", filters.user_id);
    if (filters.start_date) params.append("start_date", filters.start_date);
    if (filters.end_date) params.append("end_date", filters.end_date);
    
    await triggerExport(`/audit-logs/export?${params.toString()}`, "audit-logs-export.csv");
  };

  const columns = [
    {
      accessorKey: "at",
      header: "Timestamp",
      cell: ({ row }: { row: { original: AuditLogRow } }) => format(new Date(row.original.at), "MMM d, yyyy HH:mm:ss")
    },
    {
      accessorKey: "user.name",
      header: "User",
      cell: ({ row }: { row: { original: AuditLogRow } }) => row.original.user ? row.original.user.name : "System"
    },
    {
      accessorKey: "action",
      header: "Action",
      cell: ({ row }: { row: { original: AuditLogRow } }) => (
        <span className="bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded text-[10px] font-mono">
          {row.original.action}
        </span>
      )
    },
    {
      accessorKey: "subject_type",
      cell: ({ row }: { row: { original: AuditLogRow } }) => {
        if (!row.original.subject_type) return "-";
        const t = row.original.subject_type.split('\\').pop();
        const id = row.original.subject_id;
        
        let href = "";
        if (t === "User") href = `/dashboard/directory`; // no user detail page yet, just list
        else if (t === "Project") href = `/dashboard/projects/${id}`;
        else if (t === "Department") href = `/dashboard/directory?tab=departments`;
        else if (t === "WorkSchedule") href = `/dashboard/settings?tab=schedule`;
        else if (t === "QaForm") href = "";
        
        const label = `${t} #${id}`;
        if (href) {
          return <Link href={href} className="text-primary-600 hover:underline">{label}</Link>;
        }
        return label;
      }
    },
    {
      accessorKey: "ip",
      header: "IP Address",
      cell: ({ row }: { row: { original: AuditLogRow } }) => (
        <span className="text-neutral-400 font-mono text-[10px]">
          {row.original.ip || "—"}
        </span>
      )
    }
  ];

  return (
    <div className="h-full py-4">
      <ListScaffold
        title="Audit Log"
        hideSearch={true}
        filters={[
          {
            key: "action",
            label: "Action",
            type: "select",
            options: [
              { label: "All Actions", value: "" },
              { label: "login", value: "login" },
              { label: "logout", value: "logout" },
              { label: "create", value: "create" },
              { label: "update", value: "update" },
              { label: "delete", value: "delete" },
            ],
            value: filters.action,
            onChange: (v) => setAction(v as string)
          },
          {
            key: "user_id",
            label: "User",
            type: "select",
            options: userOptions,
            value: filters.user_id,
            onChange: (v) => setUserId(v as string)
          }
        ]}
        actions={
          <>
            <div className="hidden md:flex items-center gap-2 text-sm text-neutral-500 mr-2">
              <DatePicker
                value={filters.start_date ? new Date(filters.start_date) : undefined}
                onChange={(date) => setStartDate(date ? format(date, "yyyy-MM-dd") : "")}
                className="h-9 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-card dark:bg-neutral-900"
                placeholder="Start date"
              />
              <span>to</span>
              <DatePicker
                value={filters.end_date ? new Date(filters.end_date) : undefined}
                onChange={(date) => setEndDate(date ? format(date, "yyyy-MM-dd") : "")}
                className="h-9 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-card dark:bg-neutral-900"
                placeholder="End date"
              />
            </div>
            <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting} className="h-9 whitespace-nowrap shadow-sm text-neutral-600 dark:text-neutral-300">
              <AppIcon name="download" />
              {isExporting ? "Queuing..." : "Export CSV"}
            </Button>
          </>
        }
        columns={columns}
        data={logs}
        isLoading={isLoading}
        isError={isError}
        pagination={{
          page,
          perPage,
          totalPages,
          onPageChange: setPage,
          onPerPageChange: setPerPage
        }}
        mobileCardRenderer={(log) => (
          <div className="flex flex-col gap-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded text-[10px] font-mono">
                  {log.action}
                </span>
                <span className="text-sm font-medium">{log.user ? log.user.name : "System"}</span>
              </div>
              <span className="text-[10px] text-neutral-500">{format(new Date(log.at), "MMM d, HH:mm")}</span>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 text-xs">
              <span className="text-neutral-500">{log.subject_type ? `${log.subject_type.split('\\').pop()} #${log.subject_id}` : "-"}</span>
              <span className="text-neutral-400 font-mono text-[10px]">{log.ip || "—"}</span>
            </div>
          </div>
        )}
      />
    </div>
  );
}
