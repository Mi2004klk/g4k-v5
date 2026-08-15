"use client";
import Link from "next/link";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { AppIcon, IconName } from "@g4k/ui/components";
import { apiFetch } from "@/lib/api-client";
import { toast } from "sonner";
import { Card, CardContent } from "@g4k/ui/components";
import { Button } from "@g4k/ui/components";
import { DataTable } from "@g4k/ui/components";
import { FilterBar, DatePicker } from "@g4k/ui/components";
import { getAuthToken } from "@/lib/auth-store";
import { safeFormat } from "@/lib/format";

import { useUrlState } from "@/hooks/use-url-state";
import { queryKeys } from "@/lib/query-keys";

export function AuditLogTable() {
  const [action, setAction] = useUrlState("action", "");
  const [userId, setUserId] = useUrlState("user_id", "");
  const [startDate, setStartDate] = useUrlState("start_date", "");
  const [endDate, setEndDate] = useUrlState("end_date", "");
  const filters = { action, user_id: userId, start_date: startDate, end_date: endDate };
  const [isExporting, setIsExporting] = useState(false);
  
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  const { data: usersResponse } = useQuery({
    queryKey: queryKeys.usersList,
    queryFn: () => apiFetch("/users?per_page=100"),
  });
  const users = usersResponse?.data || [];
  const userOptions = [{ label: "All Users", value: "" }, { label: "System", value: "system" }].concat(
    users.map((u: any) => ({ label: u.name, value: String(u.id) }))
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

  const logs = logsData?.data?.data || [];
  const totalPages = logsData?.data?.last_page || 1;

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const params = new URLSearchParams();
      if (filters.action) params.append("action", filters.action);
      if (filters.user_id) params.append("user_id", filters.user_id);
      if (filters.start_date) params.append("start_date", filters.start_date);
      if (filters.end_date) params.append("end_date", filters.end_date);
      
      await apiFetch(`/audit-logs/export?${params.toString()}`, { method: "POST" });
      toast.success("Export queued. You will be notified when it's ready.");
    } catch (err: any) {
      toast.error(err.message || "Failed to start export.");
    } finally {
      setIsExporting(false);
    }
  };

  const columns = [
    {
      accessorKey: "at",
      header: "Timestamp",
      cell: ({ row }: any) => format(new Date(row.original.at), "MMM d, yyyy HH:mm:ss")
    },
    {
      accessorKey: "user.name",
      header: "User",
      cell: ({ row }: any) => row.original.user ? row.original.user.name : "System"
    },
    {
      accessorKey: "action",
      header: "Action",
      cell: ({ row }: any) => (
        <span className="bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded text-[10px] font-mono">
          {row.original.action}
        </span>
      )
    },
    {
      accessorKey: "subject_type",
      cell: ({ row }: any) => {
        if (!row.original.subject_type) return "-";
        const t = row.original.subject_type.split('\\').pop();
        const id = row.original.subject_id;
        
        let href = "";
        if (t === "User") href = `/dashboard/users`; // no user detail page yet, just list
        else if (t === "Project") href = `/dashboard/projects/${id}`;
        else if (t === "Department") href = `/dashboard/settings?tab=departments`;
        else if (t === "WorkSchedule") href = `/dashboard/settings?tab=schedules`;
        else if (t === "QaForm") href = `/dashboard/settings?tab=qa`;
        
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
      cell: ({ row }: any) => (
        <span className="text-neutral-400 font-mono text-[10px]">
          {row.original.ip || "127.0.0.1"}
        </span>
      )
    }
  ];

  return (
    <Card className=" border border-neutral-200 dark:border-neutral-800 shadow-e1 hover:shadow-e2 transition-shadow duration-150 rounded-xl overflow-hidden h-full">
      <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex justify-between gap-4 bg-neutral-50/50 dark:bg-neutral-800/30">
        <div className="flex-1 max-w-xl">
          <FilterBar
            searchQuery={filters.action}
            onSearchChange={(val) => setAction(val)}
            searchPlaceholder="Filter by action (e.g. login, update)..."
            filters={[
              {
                key: "user_id",
                label: "User",
                type: "select",
                options: userOptions,
                value: filters.user_id,
                onChange: (v) => setUserId(v)
              }
            ]}
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-neutral-500">
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
        <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting} className="h-9 whitespace-nowrap">
          <AppIcon name="download" className=" mr-2" />
          {isExporting ? "Queuing..." : "Export CSV"}
        </Button>
      </div>

      <CardContent className="p-0 overflow-x-auto w-full">
          <DataTable
            columns={columns}
            data={logs}
            isLoading={isLoading}
            isError={isError}
            stickyHeader={true}
            stickyFirstCol={true}
            page={page}
            perPage={perPage}
            totalPages={totalPages}
            onPageChange={setPage}
            onPerPageChange={setPerPage}
          />
      </CardContent>
    </Card>
  );
}
