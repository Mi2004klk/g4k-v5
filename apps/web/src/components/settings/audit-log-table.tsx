"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Loader2, Search, Filter } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { Card, CardContent } from "@g4k/ui/components";
import { Button } from "@g4k/ui/components";

export function AuditLogTable() {
  const [filters, setFilters] = useState({ action: "", user_id: "" });
  
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

  return (
    <Card className="border-none shadow-sm">
      <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex gap-4 bg-neutral-50/50 dark:bg-neutral-800/30">
        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Filter by action (e.g. login, update)..."
            value={filters.action}
            onChange={(e) => setFilters({ ...filters, action: e.target.value })}
            className="w-full text-sm pl-9 pr-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-1"
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="w-4 h-4" />
        </Button>
      </div>

      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-12 flex justify-center text-neutral-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading audit logs...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-sm text-neutral-500">No audit events found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-neutral-50 dark:bg-neutral-800/60 text-neutral-500 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Target</th>
                  <th className="px-4 py-3">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {logs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30">
                    <td className="px-4 py-3 whitespace-nowrap text-neutral-500">
                      {format(new Date(log.at), "MMM d, yyyy HH:mm:ss")}
                    </td>
                    <td className="px-4 py-3 font-medium text-neutral-700 dark:text-neutral-300">
                      {log.user ? log.user.name : "System"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded text-[10px] font-mono">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-500">
                      {log.subject_type ? `${log.subject_type.split('\\').pop()} #${log.subject_id}` : "-"}
                    </td>
                    <td className="px-4 py-3 text-neutral-400 font-mono text-[10px]">
                      {log.ip || "127.0.0.1"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
