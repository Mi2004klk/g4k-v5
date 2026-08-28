"use client";

import { useState, useMemo } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { format, differenceInSeconds } from "date-fns";
import { AppIcon, Spinner } from "@g4k/ui/components";
import { safeFormat } from "@/lib/format";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@g4k/ui/components";
import { Button, Input, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, Textarea } from "@g4k/ui/components";
import { apiFetch, isQueued } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

interface HrCorrectionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  dayId: number;
  userId: number;
  date: string;
  defaultAction?: "add_event" | "edit_event" | "remove_event";
  defaultType?: "clock_in" | "clock_out" | "break_start" | "break_end";
}

export function HrCorrectionDialog({ 
  isOpen, 
  onOpenChange, 
  dayId, 
  userId, 
  date,
  defaultAction = "add_event",
  defaultType = "clock_out"
}: HrCorrectionDialogProps) {
  const queryClient = useQueryClient();
  
  const [action, setAction] = useState(defaultAction);
  const [eventId, setEventId] = useState("");
  const [type, setType] = useState(defaultType);
  const [timestamp, setTimestamp] = useState(format(new Date(), "HH:mm"));
  const [reason, setReason] = useState("");

  const { data: dayData, isLoading } = useQuery({
    queryKey: queryKeys.memberAttendanceDay(userId, date),
    queryFn: () => apiFetch(`/attendance/hr/day/${date}/${userId}`),
    enabled: isOpen && !!userId && !!date,
  });

  const events = useMemo(() => dayData?.events || [], [dayData?.events]);
  
  // Predict reconciled totals
  const predictedTotals = useMemo(() => {
    if (!events.length) return null;
    
    // Copy events array for mutation simulation
    let simulatedEvents = [...events];
    
    // Build simulated event
    const fullTimestamp = `${date}T${timestamp}:00`;
    
    if (action === "add_event") {
      simulatedEvents.push({
        id: -1,
        type,
        timestamp: fullTimestamp
      });
    } else if (action === "edit_event" && eventId) {
      simulatedEvents = simulatedEvents.map(e => 
        e.id.toString() === eventId ? { ...e, type, timestamp: fullTimestamp } : e
      );
    } else if (action === "remove_event" && eventId) {
      simulatedEvents = simulatedEvents.filter(e => e.id.toString() !== eventId);
    }

    // Sort simulated events by timestamp
    simulatedEvents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    let totalSeconds = 0;
    let currentIn = null;
    
    
    for (const ev of simulatedEvents) {
      if (ev.type === "clock_in") {
        currentIn = new Date(ev.timestamp);
      } else if (ev.type === "break_start") {
        if (currentIn) {
          totalSeconds += differenceInSeconds(new Date(ev.timestamp), currentIn);
          currentIn = null;
        }
        
      } else if (ev.type === "break_end") {
        
        currentIn = new Date(ev.timestamp);
      } else if (ev.type === "clock_out") {
        if (currentIn) {
          totalSeconds += differenceInSeconds(new Date(ev.timestamp), currentIn);
          currentIn = null;
        }
      }
    }

    // If there's an open shift in simulation, assume clock out at now (if today) or end of day
    if (currentIn) {
      const now = new Date();
      if (date === format(now, "yyyy-MM-dd")) {
        totalSeconds += differenceInSeconds(now, currentIn);
      }
    }

    const currentTotal = dayData?.day?.total_seconds || 0;
    
    return {
      current: currentTotal,
      predicted: totalSeconds > 0 ? totalSeconds : 0
    };
  }, [events, action, eventId, type, timestamp, date, dayData]);

  const correctMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      return apiFetch("/attendance/correct", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: (data: any) => {
      if (isQueued(data)) return;
      toast.success("Attendance record corrected and audited.");
      queryClient.invalidateQueries({ queryKey: [queryKeys.hrAttendance(date, "all")[0]] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.adminAttendance(date, "all")[0]] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.memberAttendanceDay(userId, date)[0]] });
      queryClient.invalidateQueries({ queryKey: queryKeys.orgAttendance }); // generic cache
      onOpenChange(false);
      setReason("");
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || "Failed to correct record.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error("Correction reason is mandatory.");
      return;
    }

    const payload: Record<string, unknown> = {
      action,
      attendance_day_id: dayId,
      user_id: userId,
      date,
      reason,
    };

    if (action === "add_event" || action === "edit_event") {
      payload.type = type;
      payload.timestamp = `${date} ${timestamp}:00`;
    }

    if (action === "edit_event" || action === "remove_event") {
      if (!eventId) {
        toast.error("Please select an event.");
        return;
      }
      payload.event_id = eventId;
    }

    correctMutation.mutate(payload);
  };

  const formatHours = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    return `${h}h ${m}m`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DialogDescription className="sr-only">Review and process this attendance correction request.</DialogDescription>
              <AppIcon name="teamAttendance" size="lg" className=" text-primary-500" />
              Manual Correction
            </DialogTitle>
            <DialogDescription>
              Audit-logged correction for {dayData?.user?.name} on {safeFormat(date, "MMM d, yyyy")}.
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="py-12 flex justify-center">
              <Spinner size="xl" className="text-neutral-400" />
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Action</label>
                <Select value={action} onValueChange={(val: string) => setAction(val as "add_event" | "edit_event" | "remove_event")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="add_event">Add Event</SelectItem>
                    <SelectItem value="edit_event">Edit Event</SelectItem>
                    <SelectItem value="remove_event">Remove Event</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(action === "edit_event" || action === "remove_event") && (
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Target Event</label>
                  <Select value={eventId} onValueChange={setEventId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select event to modify" />
                    </SelectTrigger>
                    <SelectContent>
                      {events.map((ev: { id: number; type: string; timestamp: string }) => (
                        <SelectItem key={ev.id} value={ev.id.toString()}>
                          {ev.type.replace('_', ' ')} at {safeFormat(ev.timestamp, "hh:mm a")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {(action === "add_event" || action === "edit_event") && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Event Type</label>
                    <Select value={type} onValueChange={(val: string) => setType(val as "clock_in" | "clock_out" | "break_start" | "break_end")}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="clock_in">Clock In</SelectItem>
                        <SelectItem value="break_start">Break Start</SelectItem>
                        <SelectItem value="break_end">Break End</SelectItem>
                        <SelectItem value="clock_out">Clock Out</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Time</label>
                    <Input 
                      type="time" 
                      value={timestamp}
                      onChange={(e) => setTimestamp(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              <div className="grid gap-2">
                <label className="text-sm font-medium">Mandatory Reason</label>
                <Textarea 
                  placeholder="Explain why this correction is necessary..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="resize-none"
                  rows={3}
                  required
                />
              </div>

              {predictedTotals && predictedTotals.current !== predictedTotals.predicted && (
                <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-200 dark:border-amber-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                    <AppIcon name="error" />
                    <span className="text-xs font-semibold uppercase tracking-wide">Reconciled Preview</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono font-bold text-sm">
                    <span className="text-neutral-500 line-through">{formatHours(predictedTotals.current)}</span>
                    <AppIcon name="arrowRight" size="xs" className=" text-amber-500" />
                    <span className="text-amber-700 dark:text-amber-400">{formatHours(predictedTotals.predicted)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={correctMutation.isPending || isLoading || (!reason.trim())}
              className="bg-primary-600 hover:bg-primary-700 text-white"
            >
              {correctMutation.isPending && <Spinner className="mr-2" />}
              <AppIcon name="save" className=" mr-2" />
              Save Correction
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

