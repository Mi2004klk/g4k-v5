"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Download } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { toast } from "sonner";
import { Card, CardContent } from "@g4k/ui/components";
import { Button } from "@g4k/ui/components";
import { DataTable } from "@g4k/ui/components";
import { FilterBar } from "@g4k/ui/components";
import { getAuthToken } from "@/lib/auth-store";

import { useUrlState } from "@/hooks/use-url-state";

export function AuditLogTable() {
  const [action, setAction] = useUrlState("action", "");
  const [userId, setUserId] = useUrlState("user_id", "");
  const [startDate, setStartDate] = useUrlState("start_date", "");
  const [endDate, setEndDate] = useUrlState("end_date", "");
  const filters = { action, user_id: userId, start_date: startDate, end_date: endDate };
  const [isExporting, setIsExporting] = useState(false);

  const { data: usersResponse } = useQuery({
    queryKey: ["users-list"],
    queryFn: () => apiFetch("/users?per_page=1000"),
  });
  const users = usersResponse?.data || [];
  const userOptions = [{ label: "All Users", value: "" }, { label: "System", value: "system" }].concat(
    users.map((u: any) => ({ label: u.name, value: String(u.id) }))
  );
  
  const { data: logsData, isLoading } = useQuery({
    queryKey: ["audit-logs", filters],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters.action) params.append("action", filters.action);
      if (filters.user_id) params.append("user_id", filters.user_id);
      if (filters.start_date) params.append("start_date", filters.start_date);
      if (filters.end_date) params.append("end_date", filters.end_date);
      return apiFetch(`/audit-logs?${params.toString()}`);
    },
  });

  const logs = logsData?.data || [];

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
      header: "Target",
      cell: ({ row }: any) => row.original.subject_type ? `${row.original.subject_type.split('\\').pop()} #${row.original.subject_id}` : "-"
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
    <Card className="border-none shadow-sm">
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
          <input
            type="date"
            value={filters.start_date}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-9 px-3 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
          />
          <span>to</span>
          <input
            type="date"
            value={filters.end_date}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-9 px-3 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
          />
        </div>
        <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting} className="h-9 whitespace-nowrap">
          <Download className="w-4 h-4 mr-2" />
          {isExporting ? "Queuing..." : "Export CSV"}
        </Button>
      </div>

      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-12 text-center text-sm text-neutral-500">Loading audit logs...</div>
        ) : (
          <DataTable
            columns={columns}
            data={logs}
          />
        )}
      </CardContent>
    </Card>
  );
}
