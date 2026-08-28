"use client";

import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppIcon } from "@g4k/ui/components";
import { apiFetch, isQueued } from "@/lib/api-client";
import { Button } from "@g4k/ui/components";
import { RadioGroup, RadioGroupItem } from "@g4k/ui/components";
import { Textarea } from "@g4k/ui/components";
import { Label } from "@g4k/ui/components";
import { DatePicker } from "@g4k/ui/components";
import { format } from "date-fns";
import { FormError } from "@/components/forms/form-error";
import { queryKeys } from "@/lib/query-keys";
import { LEAVE_TYPES } from "@/lib/constants";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@g4k/ui/components";
import { cn } from "@/lib/utils";

interface LeaveRecord {
  id: number;
  type: string;
  start_date: string;
  end_date: string;
  reason?: string;
  status: string;
}

interface EditLeaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leaveRequest: LeaveRecord | null;
  onSuccess?: () => void;
}

export function EditLeaveDialog({ open, onOpenChange, leaveRequest, onSuccess }: EditLeaveDialogProps) {
  const queryClient = useQueryClient();
  const formId = React.useId();
  
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [type, setType] = useState<string>("casual");
  const [reason, setReason] = useState<string>("");

  useEffect(() => {
    if (leaveRequest && open) {
      setStartDate(new Date(leaveRequest.start_date));
      setEndDate(new Date(leaveRequest.end_date));
      setType(leaveRequest.type);
      setReason(leaveRequest.reason || "");
      setFieldErrors({});
    }
  }, [leaveRequest, open]);

  const submitMutation = useMutation({
    mutationFn: async (payload: { start_date: string; end_date: string; type: string; reason: string }) => {
      if (!leaveRequest) throw new Error("No leave request selected");
      return apiFetch(`/leave-requests/${leaveRequest.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: (data: any) => {
      if (isQueued(data)) return;
      toast.success("Leave request updated successfully.");
      queryClient.invalidateQueries({ queryKey: ['admin_leave_history'] });
      queryClient.invalidateQueries({ queryKey: ['org_leave_requests_paginated'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.myLeaveHistory() });
      if (onSuccess) onSuccess();
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update leave request.");
      if (err.errors) {
        setFieldErrors(err.errors);
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    
    if (!startDate) {
      setFieldErrors(prev => ({ ...prev, start_date: ["Start date is required"] }));
      return;
    }
    
    if (!endDate) {
      setFieldErrors(prev => ({ ...prev, end_date: ["End date is required"] }));
      return;
    }

    if (endDate < startDate) {
      setFieldErrors(prev => ({ ...prev, end_date: ["End date cannot be before start date"] }));
      return;
    }
    
    submitMutation.mutate({
      start_date: format(startDate, "yyyy-MM-dd"),
      end_date: format(endDate, "yyyy-MM-dd"),
      type: type,
      reason: reason
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Leave Request</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`${formId}-start`} className="font-semibold text-neutral-700 dark:text-neutral-300">Start Date</Label>
              <DatePicker 
                value={startDate}
                onChange={(d: Date | undefined) => {
                  setStartDate(d);
                  if (d && endDate && d > endDate) setEndDate(d);
                }}
                placeholder="Select start date"
                disabled={submitMutation.isPending}
              />
              <FormError errors={fieldErrors.start_date} />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${formId}-end`} className="font-semibold text-neutral-700 dark:text-neutral-300">End Date</Label>
              <DatePicker 
                value={endDate}
                onChange={(d: Date | undefined) => {
                  setEndDate(d);
                  if (d && startDate && d < startDate) setStartDate(d);
                }}
                placeholder="Select end date"
                disabled={submitMutation.isPending}
              />
              <FormError errors={fieldErrors.end_date} />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="font-semibold text-neutral-700 dark:text-neutral-300">Leave Type</Label>
            <RadioGroup 
              value={type} 
              onValueChange={setType}
              className="grid grid-cols-2 gap-3"
              disabled={submitMutation.isPending}
            >
              {LEAVE_TYPES.filter(t => t.value !== 'all').map((t) => (
                <div key={t.value}>
                  <RadioGroupItem value={t.value} id={`${formId}-type-${t.value}`} className="peer sr-only" />
                  <Label
                    htmlFor={`${formId}-type-${t.value}`}
                    className="flex flex-col items-center justify-between rounded-lg border-2 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 peer-data-[state=checked]:border-brand-600 dark:peer-data-[state=checked]:border-brand-500 peer-data-[state=checked]:bg-brand-50 dark:peer-data-[state=checked]:bg-brand-900/20 peer-data-[state=checked]:text-brand-700 dark:peer-data-[state=checked]:text-brand-300 cursor-pointer transition-all"
                  >
                    <span className="text-sm font-medium">{t.label}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
            <FormError errors={fieldErrors.type} />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${formId}-reason`} className="font-semibold text-neutral-700 dark:text-neutral-300">
              Reason <span className="text-neutral-400 font-normal">(Optional)</span>
            </Label>
            <Textarea
              id={`${formId}-reason`}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide any details about your leave..."
              className="resize-none min-h-[100px] bg-neutral-50/50 dark:bg-neutral-900/50 focus:bg-white dark:focus:bg-neutral-900 transition-colors"
              disabled={submitMutation.isPending}
            />
            <FormError errors={fieldErrors.reason} />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)} disabled={submitMutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitMutation.isPending}>
              {submitMutation.isPending ? "Updating..." : "Update Request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
