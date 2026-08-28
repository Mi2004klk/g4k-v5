"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Input,
  Label,
  Switch,
  Spinner,
  AppIcon,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@g4k/ui/components";

interface ScheduledReport {
  id: number;
  name: string;
  type: string;
  frequency: string;
  time: string;
  day_of_week?: number;
  day_of_month?: number;
  recipients: string[];
  is_active: boolean;
  last_run_at?: string;
  next_run_at?: string;
}

export function ScheduledReportsConfig() {
  const queryClient = useQueryClient();
  const [newReport, setNewReport] = useState<Partial<ScheduledReport>>({
    name: "",
    type: "leave_summary",
    frequency: "weekly",
    time: "09:00",
    day_of_week: 1,
    recipients: [""],
  });

  const { data: reports, isLoading } = useQuery<ScheduledReport[]>({
    queryKey: ["scheduled-reports"],
    queryFn: () => apiFetch("/scheduled-reports"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: any }) => {
      return apiFetch(`/scheduled-reports/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-reports"] });
      toast.success("Report schedule updated");
    },
    onError: () => toast.error("Failed to update report schedule"),
  });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const payloadCopy = { ...payload };
      payloadCopy.recipients = payloadCopy.recipients.filter((r: string) => r.trim() !== "");
      return apiFetch("/scheduled-reports", {
        method: "POST",
        body: JSON.stringify(payloadCopy),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-reports"] });
      setNewReport({
        name: "",
        type: "leave_summary",
        frequency: "weekly",
        time: "09:00",
        day_of_week: 1,
        recipients: [""],
      });
      toast.success("Report schedule created");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create report schedule");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiFetch(`/scheduled-reports/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-reports"] });
      toast.success("Report schedule deleted");
    }
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReport.name || !newReport.recipients?.[0]) return;
    createMutation.mutate(newReport);
  };

  const getFreqIcon = (freq: string) => {
    switch (freq) {
      case 'daily': return 'calendar';
      case 'weekly': return 'calendar';
      case 'monthly': return 'calendar';
      default: return 'file';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-e2 bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-lg">
              <AppIcon name="file" size="sm" />
            </div>
            Scheduled Reports Engine
          </CardTitle>
          <CardDescription>Automate report generation and delivery via email.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {isLoading ? (
            <div className="flex justify-center p-8"><Spinner /></div>
          ) : reports?.length === 0 ? (
            <div className="text-center p-8 bg-neutral-50 dark:bg-neutral-900/40 rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800">
              <AppIcon name="file" className="mx-auto h-8 w-8 text-neutral-400 mb-3" />
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">No scheduled reports configured yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reports?.map((report) => (
                <div key={report.id} className={`flex flex-col p-4 rounded-xl border transition-all duration-200 ${report.is_active ? 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 shadow-sm' : 'bg-neutral-50 dark:bg-neutral-900/40 border-neutral-100 dark:border-neutral-800/50 opacity-70 grayscale'}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-lg ${report.is_active ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'bg-neutral-200 text-neutral-500 dark:bg-neutral-800'}`}>
                        <AppIcon name={getFreqIcon(report.frequency) as any} size="sm" />
                      </div>
                      <div>
                        <p className="font-semibold text-neutral-900 dark:text-white leading-tight">{report.name}</p>
                        <p className="text-xs text-neutral-500 mt-0.5 font-mono">{report.type} • {report.frequency}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={report.is_active}
                        onCheckedChange={(checked) => updateMutation.mutate({ id: report.id, payload: { is_active: checked } })}
                        className="data-[state=checked]:bg-green-500"
                      />
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => deleteMutation.mutate(report.id)}>
                        <AppIcon name="trash" size="sm" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                     <div className="bg-neutral-50 dark:bg-neutral-900/50 p-2 rounded-lg">
                        <span className="text-neutral-400 block mb-0.5">Time</span>
                        <span className="font-medium text-neutral-700 dark:text-neutral-300">{report.time}</span>
                     </div>
                     <div className="bg-neutral-50 dark:bg-neutral-900/50 p-2 rounded-lg truncate">
                        <span className="text-neutral-400 block mb-0.5">Recipients</span>
                        <span className="font-medium text-neutral-700 dark:text-neutral-300" title={report.recipients.join(', ')}>{report.recipients.join(', ')}</span>
                     </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800/60 mt-auto text-[10px]">
                    <span className="text-neutral-500">Last run: {report.last_run_at ? new Date(report.last_run_at).toLocaleString() : 'Never'}</span>
                    <span className="text-neutral-500 font-medium">Next run: {report.next_run_at ? new Date(report.next_run_at).toLocaleString() : 'N/A'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-2 mb-4">
              <AppIcon name="plus" size="sm" className="text-neutral-400" />
              <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">Add Scheduled Report</h3>
            </div>
            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-neutral-50 dark:bg-neutral-900/50 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800">
              <div className="space-y-1.5 col-span-1 md:col-span-2">
                <Label className="text-xs font-semibold text-neutral-600">Report Name</Label>
                <Input
                  value={newReport.name}
                  onChange={(e) => setNewReport({ ...newReport, name: e.target.value })}
                  placeholder="e.g. Weekly Leave Summary"
                  className="bg-white dark:bg-neutral-950"
                  required
                />
              </div>
              
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-neutral-600">Report Type</Label>
                <Select value={newReport.type} onValueChange={(val) => setNewReport({ ...newReport, type: val })}>
                  <SelectTrigger className="bg-white dark:bg-neutral-950">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="leave_summary">Leave Summary</SelectItem>
                    <SelectItem value="attendance_summary">Attendance Summary</SelectItem>
                    <SelectItem value="audit_logs">Audit Logs</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-neutral-600">Frequency</Label>
                <Select value={newReport.frequency} onValueChange={(val) => setNewReport({ ...newReport, frequency: val })}>
                  <SelectTrigger className="bg-white dark:bg-neutral-950">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-neutral-600">Time</Label>
                <Input
                  type="time"
                  value={newReport.time}
                  onChange={(e) => setNewReport({ ...newReport, time: e.target.value })}
                  className="bg-white dark:bg-neutral-950"
                  required
                />
              </div>

              {newReport.frequency === 'weekly' && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-neutral-600">Day of Week</Label>
                  <Select value={newReport.day_of_week?.toString()} onValueChange={(val) => setNewReport({ ...newReport, day_of_week: parseInt(val) })}>
                    <SelectTrigger className="bg-white dark:bg-neutral-950">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Monday</SelectItem>
                      <SelectItem value="2">Tuesday</SelectItem>
                      <SelectItem value="3">Wednesday</SelectItem>
                      <SelectItem value="4">Thursday</SelectItem>
                      <SelectItem value="5">Friday</SelectItem>
                      <SelectItem value="6">Saturday</SelectItem>
                      <SelectItem value="0">Sunday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {newReport.frequency === 'monthly' && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-neutral-600">Day of Month</Label>
                  <Input
                    type="number"
                    min="1" max="31"
                    value={newReport.day_of_month || 1}
                    onChange={(e) => setNewReport({ ...newReport, day_of_month: parseInt(e.target.value) })}
                    className="bg-white dark:bg-neutral-950"
                  />
                </div>
              )}

              <div className="space-y-1.5 lg:col-span-2">
                <Label className="text-xs font-semibold text-neutral-600">Recipients (Email)</Label>
                <Input
                  value={newReport.recipients?.[0] || ""}
                  onChange={(e) => setNewReport({ ...newReport, recipients: [e.target.value] })}
                  placeholder="admin@example.com"
                  className="bg-white dark:bg-neutral-950"
                  type="email"
                  required
                />
              </div>

              <div className="lg:col-span-4 flex justify-end mt-2">
                <Button type="submit" disabled={!newReport.name || !newReport.recipients?.[0] || createMutation.isPending}>
                  {createMutation.isPending ? <Spinner size="sm" className="mr-2" /> : <AppIcon name="plus" size="sm" className="mr-2" />}
                  Schedule Report
                </Button>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
