"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Download, ShieldAlert } from "lucide-react";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/audit-logs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setLogs(json.data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleExportCsv = () => {
    const token = localStorage.getItem("token");
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/audit-logs/export`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit_logs_export.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      })
      .catch(() => toast.error("Export failed"));
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-indigo-400" />
            Security & Audit Logs
          </h1>
          <p className="text-zinc-400 mt-1">Immutable record of system-wide administrative actions.</p>
        </div>
        <Button onClick={handleExportCsv} className="bg-indigo-600 hover:bg-indigo-500 gap-2">
          <Download className="w-4 h-4" /> Export CSV
        </Button>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-zinc-500">Loading audit trail...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-zinc-500">No audit logs found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-zinc-400 uppercase bg-zinc-900/50 border-b border-zinc-800">
                <tr>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold">User</th>
                  <th className="px-6 py-4 font-semibold">Action</th>
                  <th className="px-6 py-4 font-semibold">Resource</th>
                  <th className="px-6 py-4 font-semibold">Metadata</th>
                  <th className="px-6 py-4 font-semibold">IP Address</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((row, i) => (
                  <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                    <td className="px-6 py-4 text-zinc-400 whitespace-nowrap">
                      {format(new Date(row.created_at), 'yyyy-MM-dd HH:mm:ss')}
                    </td>
                    <td className="px-6 py-4 font-medium text-white">
                      {row.user_name || 'System'}
                      <div className="text-xs text-zinc-500 font-normal">{row.user_email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded text-xs">
                        {row.action_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-300">{row.resource_name || '-'}</td>
                    <td className="px-6 py-4">
                      <pre className="text-[10px] text-zinc-500 bg-zinc-950 p-2 rounded-md max-w-[200px] overflow-hidden text-ellipsis">
                        {row.metadata || '{}'}
                      </pre>
                    </td>
                    <td className="px-6 py-4 text-zinc-500 font-mono text-xs">{row.ip_address || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
