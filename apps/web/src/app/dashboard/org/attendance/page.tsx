"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { Download, Filter, Edit2, Clock, Loader2, CheckCircle2 } from "lucide-react";
import { apiFetch } from "@/lib/api-client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

export default function OrgAttendancePage() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [statusFilter, setStatusFilter] = useState("all");
  const [correctItem, setCorrectItem] = useState<any | null>(null);

  // Correction form
  const [correctField, setCorrectField] = useState("total_seconds");
  const [correctValue, setCorrectValue] = useState("");
  const [correctReason, setCorrectReason] = useState("");

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

  const handleExport = () => {
    const token = localStorage.getItem("token");
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
    window.open(`${baseUrl}/attendance/export?date=${selectedDate}&token=${token}`, "_blank");
  };

  const records = data?.data || [];

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

      {/* FilterBar */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-4 flex flex-col md:flex-row items-center gap-4">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs font-semibold text-neutral-500">Date:</span>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs h-9"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs font-semibold text-neutral-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 text-xs rounded-md border border-input bg-background"
            >
              <option value="all">All Statuses</option>
              <option value="present">Present</option>
              <option value="late">Late</option>
              <option value="absent">Absent</option>
              <option value="leave">Leave</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-0 overflow-x-auto">
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
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 uppercase font-semibold border-b border-neutral-100 dark:border-neutral-800">
                <tr>
                  <th className="px-6 py-3">Employee</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Clock In</th>
                  <th className="px-6 py-3">Clock Out</th>
                  <th className="px-6 py-3">Worked Hours</th>
                  <th className="px-6 py-3">Overtime</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {records.map((row: any) => {
                  const hours = Math.floor((row.total_seconds || 0) / 3600);
                  const mins = Math.floor(((row.total_seconds || 0) % 3600) / 60);
                  const otHours = Math.floor((row.overtime_seconds || 0) / 3600);
                  const otMins = Math.floor(((row.overtime_seconds || 0) % 3600) / 60);

                  return (
                    <tr
                      key={row.id}
                      className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors"
                    >
                      <td className="px-6 py-4 font-semibold text-neutral-900 dark:text-white">
                        <div>{row.user_name || "Employee"}</div>
                        <div className="text-[11px] text-neutral-400 font-normal">
                          {row.user_email}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            row.status === "present"
                              ? "bg-emerald-100 text-emerald-700"
                              : row.status === "late"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-neutral-500">
                        {row.clock_in ? format(new Date(row.clock_in), "hh:mm a") : "—"}
                      </td>
                      <td className="px-6 py-4 font-mono text-neutral-500">
                        {row.clock_out ? format(new Date(row.clock_out), "hh:mm a") : "—"}
                      </td>
                      <td className="px-6 py-4 font-mono font-bold">
                        {hours}h {mins}m
                      </td>
                      <td className="px-6 py-4 font-mono text-amber-600">
                        {otHours}h {otMins}m
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCorrectItem(row)}
                          className="h-8 gap-1 text-violet-600 hover:text-violet-700"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Correct</span>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
