"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { Download, Filter, Edit2, Clock, Loader2, CheckCircle2 } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";

import { Button } from "@g4k/ui/components";
import { Input } from "@g4k/ui/components";
import { Card, CardContent } from "@g4k/ui/components";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@g4k/ui/components";
import { Skeleton } from "@g4k/ui/components";
import { EmptyState } from "@g4k/ui/components";
import { HrAttendanceGraph } from "@/components/attendance/hr-attendance-graph";
import { useUrlState } from "@/hooks/use-url-state";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@g4k/ui/components";

export default function OrgAttendancePage() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useUrlState("date", format(new Date(), "yyyy-MM-dd"));
  const [statusFilter, setStatusFilter] = useUrlState("status", "all");
  const [correctItem, setCorrectItem] = useState<any | null>(null);

  // Correction form
  const [correctField, setCorrectField] = useState("total_seconds");
  const [correctValue, setCorrectValue] = useState("");
  const [correctReason, setCorrectReason] = useState("");

  const { data: graphDataResponse } = useQuery({
    queryKey: ["hr-attendance-graph"],
    queryFn: async () => apiFetch("/attendance/hr/graph"),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["org-attendance", selectedDate, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedDate) params.append("date", selectedDate);
      if (statusFilter !== "all") params.append("status", statusFilter);
      return apiFetch(`/attendance/admin/overview?${params.toString()}`);
    },
  });

  const correctMutation = useMutation({
    mutationFn: async (payload: any) => {
      return apiFetch("/attendance/correct", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      toast.success("Attendance record corrected and audited.");
      setCorrectItem(null);
      setCorrectReason("");
      setCorrectValue("");
      queryClient.invalidateQueries({ queryKey: ["org-attendance"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to correct record.");
    },
  });

  const handleExport = async () => {
    try {
      const token = useAuthStore.getState().token;
      const res = await fetch(`/api/attendance/export?date=${selectedDate}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `attendance-export-${selectedDate}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      toast.error(err.message || "Failed to download export.");
    }
  };

  const records = data?.data || [];

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "user_name",
      header: "Employee",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-semibold text-neutral-900 dark:text-white">{row.original.user_name || "Employee"}</span>
          <span className="text-[11px] text-neutral-400 font-normal">{row.original.user_email}</span>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
              status === "present"
                ? "bg-emerald-100 text-emerald-700"
                : status === "late"
                ? "bg-amber-100 text-amber-700"
                : "bg-rose-100 text-rose-700"
            }`}
          >
            {status}
          </span>
        );
      },
    },
    {
      accessorKey: "clock_in",
      header: "Clock In",
      cell: ({ row }) => {
        const val = row.getValue("clock_in") as string;
        return <span className="font-mono text-neutral-500">{val ? format(new Date(val), "hh:mm a") : "—"}</span>;
      },
    },
    {
      accessorKey: "clock_out",
      header: "Clock Out",
      cell: ({ row }) => {
        const val = row.getValue("clock_out") as string;
        return <span className="font-mono text-neutral-500">{val ? format(new Date(val), "hh:mm a") : "—"}</span>;
      },
    },
    {
      id: "worked_hours",
      header: "Worked Hours",
      cell: ({ row }) => {
        const secs = row.original.total_seconds || 0;
        const hours = Math.floor(secs / 3600);
        const mins = Math.floor((secs % 3600) / 60);
        return <span className="font-mono font-bold">{hours}h {mins}m</span>;
      },
    },
    {
      id: "overtime",
      header: "Overtime",
      cell: ({ row }) => {
        const secs = row.original.overtime_seconds || 0;
        const hours = Math.floor(secs / 3600);
        const mins = Math.floor((secs % 3600) / 60);
        return <span className="font-mono text-amber-600">{hours}h {mins}m</span>;
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <div className="text-right">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCorrectItem(row.original)}
            className="h-8 gap-1 text-violet-600 hover:text-violet-700"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Correct</span>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-neutral-900 dark:text-white">
            Company Attendance Overview
          </h1>
          <p className="text-xs text-neutral-500">
            Real-time daily shift tracking, status filters, manual corrections, and CSV export.
          </p>
        </div>
        <Button
          onClick={handleExport}
          variant="outline"
          className="gap-2 text-xs h-9"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV</span>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-neutral-900 p-4 rounded-xl shadow-sm border border-neutral-100 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-neutral-500">Date:</span>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-xs h-9 w-[150px]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {["all", "present", "late", "absent", "leave"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors border ${
                statusFilter === status
                  ? "bg-violet-600 text-white border-violet-600"
                  : "bg-white dark:bg-neutral-900 text-neutral-600 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full">
        <h2 className="text-lg font-bold mb-4 text-neutral-900 dark:text-white">Recent Attendance Trends</h2>
        <HrAttendanceGraph data={graphDataResponse?.data || []} />
      </div>

      <Card className="border-none shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : records.length === 0 ? (
            <div className="p-12">
              <EmptyState
                title="No attendance records"
                description={`No records found for date ${selectedDate}.`}
              />
            </div>
          ) : (
            <DataTable columns={columns} data={records} />
          )}
        </CardContent>
      </Card>

      {/* Correction Dialog */}
      <Dialog open={!!correctItem} onOpenChange={() => setCorrectItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Manual Attendance Correction</DialogTitle>
            <DialogDescription className="text-xs">
              Audit-logged correction for employee shift details.
            </DialogDescription>
          </DialogHeader>

          {correctItem && (
            <div className="space-y-4 py-2 text-xs">
              <div>
                <label className="font-semibold block mb-1">Employee</label>
                <div className="font-bold text-sm">{correctItem.user_name}</div>
              </div>
              <div>
                <label className="font-semibold block mb-1">Field to Correct</label>
                <select
                  value={correctField}
                  onChange={(e) => setCorrectField(e.target.value)}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background"
                >
                  <option value="total_seconds">Total Worked Seconds</option>
                  <option value="status">Status (present/absent/late/leave)</option>
                </select>
              </div>
              <div>
                <label className="font-semibold block mb-1">New Value *</label>
                <Input
                  placeholder="e.g. 28800 for 8 hours, or 'present'"
                  value={correctValue}
                  onChange={(e) => setCorrectValue(e.target.value)}
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Reason for Correction *</label>
                <Input
                  placeholder="e.g. Approved biometric clock-in failure adjustment"
                  value={correctReason}
                  onChange={(e) => setCorrectReason(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setCorrectItem(null)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                correctMutation.mutate({
                  attendance_day_id: correctItem.id,
                  field: correctField,
                  new_value: correctValue,
                  reason: correctReason,
                })
              }
              disabled={correctMutation.isPending || !correctValue || !correctReason}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              {correctMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Save Correction"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
