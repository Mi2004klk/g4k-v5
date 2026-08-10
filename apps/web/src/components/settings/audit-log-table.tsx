"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Download } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { Card, CardContent } from "@g4k/ui/components";
import { Button } from "@g4k/ui/components";
import { DataTable } from "@g4k/ui/components";
import { FilterBar } from "@g4k/ui/components";

import { useUrlState } from "@/hooks/use-url-state";

export function AuditLogTable() {
  const [action, setAction] = useUrlState("action", "");
  const [userId, setUserId] = useUrlState("user_id", "");
  const filters = { action, user_id: userId };
  
  const { data: logsData, isLoading } = useQuery({
    queryKey: ["audit-logs", filters],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters.action) params.append("action", filters.action);
      if (filters.user_id) params.append("user_id", filters.user_id);
      return apiFetch(`/audit-logs?${params.toString()}`);
    },
  });

  const logs = logsData?.data || [];

  const handleExport = () => {
    const params = new URLSearchParams();
    if (filters.action) params.append("action", filters.action);
    if (filters.user_id) params.append("user_id", filters.user_id);
    
    const url = `${process.env.NEXT_PUBLIC_API_URL}/api/audit-logs/export?${params.toString()}`;
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    
    // Auth header for export usually requires cookie or token in URL. 
    // If it's cookie-based (Sanctum), just opening it might work if credentials are included.
    // However, fetch and blob is safer for auth.
    fetch(url, {
      headers: { "Authorization": `Bearer ${localStorage.getItem("g4k_token")}` }
    })
    .then(res => res.blob())
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "audit-logs.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
    });
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
                options: [{ label: "All Users", value: "" }, { label: "My Events", value: "me" }], // Placeholder for users
                value: filters.user_id,
                onChange: (v) => setUserId(v)
              }
            ]}
          />
        </div>
        <Button variant="outline" size="sm" onClick={handleExport} className="h-9">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
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
