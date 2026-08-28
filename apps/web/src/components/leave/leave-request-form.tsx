"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppIcon, Spinner,
} from "@g4k/ui/components";
import { apiFetch, isQueued } from "@/lib/api-client";
import { Card, CardHeader, CardTitle, CardContent, FormDraftAlert } from "@g4k/ui/components";
import { Button } from "@g4k/ui/components";
import { RadioGroup, RadioGroupItem } from "@g4k/ui/components";
import { Textarea } from "@g4k/ui/components";
import { Label } from "@g4k/ui/components";
import { Popover, PopoverContent, PopoverTrigger } from "@g4k/ui/components";
import { Calendar, DatePicker } from "@g4k/ui/components";
import { format, startOfDay, differenceInDays, addDays } from "date-fns";
import { FormError } from "@/components/forms/form-error";
import { queryKeys } from "@/lib/query-keys";
import { LEAVE_TYPES } from "@/lib/constants";
import { useFormDraft } from "@/hooks/use-form-draft";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/auth-store";

interface LeaveRequestFormProps {
  inDialog?: boolean;
  onSuccess?: () => void;
}

export function LeaveRequestForm({ inDialog = false, onSuccess }: LeaveRequestFormProps) {
  const queryClient = useQueryClient();
  const formId = React.useId();
  
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  
  const userTz = (useAuthStore((state) => state.user?.company) as any)?.timezone || useAuthStore((state) => state.user?.timezone) || "Asia/Kolkata";
  const getTodayInTz = (tz: string) => {
    try {
      // 'en-CA' format is YYYY-MM-DD
      const todayStr = new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date());
      return new Date(`${todayStr}T00:00:00`);
    } catch(e) {
      const d = new Date();
      d.setHours(0,0,0,0);
      return d;
    }
  };
  const todayDate = getTodayInTz(userTz);

  const { formData: draftData, setFormData: setDraftData, hasDraft, restoreDraft, clearDraft } = useFormDraft<{
    start_date?: Date;
    end_date?: Date;
    type: string;
    reason: string;
  }>("leave_request", {
    type: "casual",
    reason: "",
  });

  // Calculate days requested
  const daysRequested = (draftData.start_date && draftData.end_date) 
    ? differenceInDays(draftData.end_date, draftData.start_date) + 1 
    : (draftData.start_date ? 1 : 0);

  const { data: balanceData } = useQuery({
    queryKey: queryKeys.leaveBalance,
    queryFn: async () => {
      return apiFetch("/leave-requests/balance");
    },
    staleTime: 5 * 60 * 1000,
  });

  interface ApiError extends Error {
    errors?: Record<string, string[]>;
  }

  const submitMutation = useMutation({
    mutationFn: async (payload: { start_date: string; end_date: string; type: string; reason: string }) => {
      return apiFetch("/leave-requests", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: (data: any) => {
      if (isQueued(data)) return;
      toast.success("Leave request submitted successfully.");
      setDraftData({
        start_date: undefined,
        end_date: undefined,
        reason: "",
        type: "casual"
      });
      clearDraft();
      queryClient.invalidateQueries({ queryKey: queryKeys.myLeaveHistory() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardInit });
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (err: ApiError) => {
      toast.error(err.message || "Failed to submit leave request.");
      if (err.errors) {
        setFieldErrors(err.errors);
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    if (!draftData.start_date || !draftData.end_date) return;

    if (draftData.end_date < draftData.start_date) {
      toast.error("End date must be on or after start date.");
      return;
    }

    if (draftData.start_date < todayDate) {
      toast.error("Start date must be today or later.");
      return;
    }

    // Optimistic checking of overlapping dates based on cached data
    const queries = queryClient.getQueriesData<unknown>({ queryKey: [queryKeys.myLeaveHistory()[0]], exact: false });
    const existingLeaves = queries.flatMap(([_queryKey, data]: [unknown, any]) => {
      if (!data) return [];
      if ('data' in data && Array.isArray(data.data)) return data.data;
      if (data.data && 'data' in data.data && Array.isArray(data.data.data)) return data.data.data;
      if (Array.isArray(data)) return data;
      return [];
    });
    
    interface CachedLeave {
      start_date: string;
      end_date: string;
      approval?: { status: string };
    }

    const hasOverlap = existingLeaves.some((leave: CachedLeave) => {
      if (leave.approval?.status !== "pending" && leave.approval?.status !== "approved") return false;
      const existStart = new Date(leave.start_date);
      const existEnd = new Date(leave.end_date);
      // @ts-ignore
      return draftData.start_date <= existEnd && draftData.end_date >= existStart;
    });

    if (hasOverlap) {
      toast.error("You already have a pending or approved leave request that overlaps with these dates.");
      return;
    }

    submitMutation.mutate({ 
      start_date: format(draftData.start_date, "yyyy-MM-dd"), 
      end_date: format(draftData.end_date, "yyyy-MM-dd"), 
      type: draftData.type, 
      reason: draftData.reason 
    });
  };

  // Helper to get an icon based on leave type
  const getLeaveIcon = (val: string) => {
    switch (val) {
      case 'casual': return 'leave';
      case 'sick': return 'plus';
      case 'earned': return 'award';
      case 'unpaid': return 'minus';
      default: return 'file';
    }
  };

  const FormContent = (
    <div className="flex flex-col h-full space-y-5">
      {hasDraft && (
        <FormDraftAlert 
          onRestore={restoreDraft} 
          onDiscard={clearDraft} 
          className="bg-amber-50/50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900"
          title="Unsaved draft"
          description="Continue from where you left off?"
        />
      )}

      {/* Header for days requested calculation */}
      {daysRequested > 0 && !inDialog && (
         <div className="flex justify-end">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 border border-primary-200 dark:border-primary-800/50">
            {daysRequested} {daysRequested === 1 ? 'Day' : 'Days'} Span <span className="font-normal opacity-80">(adjusted for working days)</span>
          </span>
         </div>
      )}
      {daysRequested > 0 && inDialog && (
        <div className="-mt-3 mb-2 flex justify-start">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 border border-primary-200 dark:border-primary-800/50">
            {daysRequested} {daysRequested === 1 ? 'Day' : 'Days'} Requested
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 flex-1 flex flex-col">
        <div className="space-y-1.5">
          <label className="text-xs uppercase tracking-wider font-semibold text-neutral-500 dark:text-neutral-400">Leave Duration *</label>
          <p className="text-[10px] text-neutral-500 mb-1.5 leading-tight">Same-day leave counts as 1 day.</p>
          <DatePicker
            mode="range"
            value={{ from: draftData.start_date, to: draftData.end_date }}
            onChange={(range: any) => {
              setDraftData({
                ...draftData,
                start_date: range?.from,
                end_date: range?.to
              });
            }}
            placeholder="Select leave start and end dates"
            className="w-full h-10 border-neutral-200 dark:border-neutral-800"
            disabled={(date: Date) => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              return date < today;
            }}
          />
          <FormError errors={fieldErrors.start_date || fieldErrors.end_date} />
        </div>
        
        <div className="space-y-1.5 flex-1 flex flex-col">
          <label className="text-xs uppercase tracking-wider font-semibold text-neutral-500 dark:text-neutral-400">Leave Type *</label>
          <p className="text-[10px] text-neutral-500 mb-1.5 leading-tight">Check your remaining balance in the sidebar.</p>
          <RadioGroup value={draftData.type} onValueChange={(val) => setDraftData({ ...draftData, type: val })} className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {LEAVE_TYPES.map((item) => {
              const bal = balanceData ? balanceData[item.value] : null;
              const isExhausted = bal ? bal.available <= 0 : false;
              
              return (
              <div key={item.value} className="relative">
                <RadioGroupItem
                  value={item.value}
                  id={`type-${formId}-${item.value}`}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={`type-${formId}-${item.value}`}
                  className={cn("flex flex-col items-center justify-center gap-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 py-3 px-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 peer-data-[state=checked]:border-primary-600 peer-data-[state=checked]:bg-primary-50 dark:peer-data-[state=checked]:border-primary-500 dark:peer-data-[state=checked]:bg-primary-900/20 [&:has([data-state=checked])]:border-primary text-xs font-medium cursor-pointer text-center transition-all shadow-sm peer-data-[state=checked]:shadow-none", isExhausted ? "opacity-60 grayscale" : "")}
                >
                  <AppIcon 
                    name={getLeaveIcon(item.value) as any} 
                    size="sm" 
                    className="text-neutral-500 peer-data-[state=checked]:text-primary-600 dark:peer-data-[state=checked]:text-primary-400" 
                  />
                  <span>{item.label}</span>
                  {bal && (
                    <span className={cn("text-xs font-bold px-1.5 py-0.5 rounded-full", isExhausted ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" : "bg-neutral-200/70 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400")}>
                      {bal.available} left
                    </span>
                  )}
                </Label>
              </div>
            )})}
          </RadioGroup>
          <FormError errors={fieldErrors.type} />
        </div>

        <div className="space-y-1.5 flex-1 flex flex-col">
          <label className="text-xs uppercase tracking-wider font-semibold text-neutral-500 dark:text-neutral-400">Reason *</label>
          <Textarea
            required
            id={`reason-${formId}`}
            rows={3}
            value={draftData.reason}
            onChange={(e) => setDraftData({ ...draftData, reason: e.target.value })}
            className={`text-sm resize-none flex-1 min-h-[80px] rounded-lg border-neutral-200 dark:border-neutral-800 focus-visible:ring-1 focus-visible:ring-primary-500 ${fieldErrors.reason ? "border-red-500 focus-visible:ring-red-500" : ""}`}
            placeholder="Briefly explain the reason for your time off..."
          />
          <FormError errors={fieldErrors.reason} />
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            disabled={submitMutation.isPending || !draftData.start_date || !draftData.end_date || !draftData.reason}
            className="w-full bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 font-medium h-10 shadow-sm transition-colors"
          >
            {submitMutation.isPending ? <Spinner /> : "Submit Request"}
          </Button>
        </div>
      </form>
    </div>
  );

  if (inDialog) {
    return FormContent;
  }

  return (
    <Card className="h-full border border-neutral-200 dark:border-neutral-800 shadow-none hover:shadow-sm transition-shadow duration-150 rounded-xl flex flex-col bg-card">
      <CardHeader className="pb-4 border-b border-neutral-100 dark:border-neutral-800/50">
        <CardTitle className="text-base font-bold flex justify-between items-center">
          Request Time Off
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-5 flex-1">
        {FormContent}
      </CardContent>
    </Card>
  );
}
