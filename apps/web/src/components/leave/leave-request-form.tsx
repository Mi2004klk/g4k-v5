"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppIcon, IconName } from "@g4k/ui/components";
import { apiFetch } from "@/lib/api-client";
import { Card, CardHeader, CardTitle, CardContent } from "@g4k/ui/components";
import { Button } from "@g4k/ui/components";
import { Input } from "@g4k/ui/components";
import { RadioGroup, RadioGroupItem } from "@g4k/ui/components";
import { Textarea } from "@g4k/ui/components";
import { Label } from "@g4k/ui/components";
import { Popover, PopoverContent, PopoverTrigger } from "@g4k/ui/components";
import { Calendar } from "@g4k/ui/components";
import { format, startOfTomorrow } from "date-fns";
import { FormError } from "@/components/forms/form-error";

import { useRouter } from "next/navigation";
import { queryKeys } from "@/lib/query-keys";
import { triggerInvalidation } from "@/lib/invalidation-map";
import { LEAVE_TYPES } from "@/lib/constants";
import { useFormDraft } from "@/hooks/use-form-draft";
import { Alert, AlertDescription, AlertTitle } from "@g4k/ui/components";

export function LeaveRequestForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [type, setType] = useState("casual");
  const [reason, setReason] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const { formData: draftData, setFormData: setDraftData, hasDraft, restoreDraft, clearDraft } = useFormDraft<{
    start_date?: Date;
    end_date?: Date;
    type: string;
    reason: string;
  }>("leave_request", {
    type: "casual",
    reason: "",
  });

  const activeStartDate = startDate ?? draftData.start_date;
  const activeEndDate = endDate ?? draftData.end_date;
  const activeType = type !== "casual" ? type : (draftData.type || "casual");
  const activeReason = reason || draftData.reason || "";

  // Update draft whenever fields change
  const handleFieldChange = (updates: Partial<typeof draftData>) => {
    setDraftData({
      start_date: startDate ?? draftData.start_date,
      end_date: endDate ?? draftData.end_date,
      type: type !== "casual" ? type : draftData.type,
      reason: reason || draftData.reason,
      ...updates
    });
  };

  const submitMutation = useMutation({
    mutationFn: async (payload: any) => {
      return apiFetch("/leave-requests", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      toast.success("Leave request submitted successfully.");
      setStartDate(undefined);
      setEndDate(undefined);
      setReason("");
      setType("casual");
      clearDraft();
      triggerInvalidation(queryClient, "leave.request");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to submit leave request.");
      if (err.errors) {
        setFieldErrors(err.errors);
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    if (!activeStartDate || !activeEndDate) return;

    if (activeEndDate < activeStartDate) {
      toast.error("End date must be on or after start date.");
      return;
    }

    const today = new Date();
    today.setHours(0,0,0,0);
    if (activeStartDate <= today) {
      toast.error("Start date must be a future date.");
      return;
    }

    // Optimistic checking of overlapping dates based on cached data
    const queries = queryClient.getQueriesData<any>({ queryKey: [queryKeys.myLeaveHistory()[0]], exact: false });
    const existingLeaves = queries.flatMap(([_, data]) => {
      if (!data) return [];
      if ('data' in data && Array.isArray(data.data)) return data.data;
      if (data.data && 'data' in data.data && Array.isArray(data.data.data)) return data.data.data;
      if (Array.isArray(data)) return data;
      return [];
    });
    const hasOverlap = existingLeaves.some((leave: any) => {
      if (leave.approval?.status !== "pending" && leave.approval?.status !== "approved") return false;
      const existStart = new Date(leave.start_date);
      const existEnd = new Date(leave.end_date);
      return activeStartDate <= existEnd && activeEndDate >= existStart;
    });

    if (hasOverlap) {
      toast.error("You already have a pending or approved leave request that overlaps with these dates.");
      return;
    }

    submitMutation.mutate({ 
      start_date: format(activeStartDate, "yyyy-MM-dd"), 
      end_date: format(activeEndDate, "yyyy-MM-dd"), 
      type: activeType, 
      reason: activeReason 
    });
  };

  const tomorrow = startOfTomorrow();

  return (
    <Card className="h-full border border-neutral-200 dark:border-neutral-800 shadow-e1 hover:shadow-e2 transition-shadow duration-150 rounded-xl flex flex-col">
      <CardHeader>
        <CardTitle className="text-base font-bold">Request Time Off</CardTitle>
      </CardHeader>
      <CardContent>
        {hasDraft && (
          <Alert className="mb-4 bg-amber-50/50 border-amber-200">
            <AppIcon name="warning" className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800">Unsaved draft</AlertTitle>
            <AlertDescription className="text-amber-700/80 flex items-center gap-4">
              You have an unsaved leave request.
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => {
                  restoreDraft();
                  setStartDate(draftData.start_date);
                  setEndDate(draftData.end_date);
                  setType(draftData.type || "casual");
                  setReason(draftData.reason || "");
                }} className="h-7 px-3 text-xs bg-white">Restore</Button>
                <Button variant="ghost" size="sm" onClick={clearDraft} className="h-7 px-3 text-xs hover:bg-amber-100/50">Discard</Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-500">Start Date *</label>
              <Popover>
                <PopoverTrigger asChild>
                  <button type="button"
                    className="flex h-9 w-full items-center justify-between rounded-[var(--radius)] border border-border bg-background px-3 text-xs">
                    {activeStartDate ? format(activeStartDate, "dd-MM-yyyy") : <span className="text-muted tracking-wide uppercase">DD-MM-YYYY</span>}
                    <AppIcon name="calendar" className=" text-muted" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={activeStartDate} onSelect={(date) => { setStartDate(date); handleFieldChange({ start_date: date }); }}
                    disabled={{ before: tomorrow }}
                    initialFocus />
                </PopoverContent>
              </Popover>
              <FormError errors={fieldErrors.start_date} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-500">End Date *</label>
              <Popover>
                <PopoverTrigger asChild>
                  <button type="button"
                    className="flex h-9 w-full items-center justify-between rounded-[var(--radius)] border border-border bg-background px-3 text-xs">
                    {activeEndDate ? format(activeEndDate, "dd-MM-yyyy") : <span className="text-muted tracking-wide uppercase">DD-MM-YYYY</span>}
                    <AppIcon name="calendar" className=" text-muted" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={activeEndDate} onSelect={(date) => { setEndDate(date); handleFieldChange({ end_date: date }); }}
                    disabled={{ before: activeStartDate ?? tomorrow }}
                    initialFocus />
                </PopoverContent>
              </Popover>
              <FormError errors={fieldErrors.end_date} />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-500">Leave Type *</label>
            <RadioGroup value={activeType} onValueChange={(val) => { setType(val); handleFieldChange({ type: val }); }} className="grid grid-cols-2 gap-2 mt-1">
              {LEAVE_TYPES.map((item) => (
                <div key={item.value}>
                  <RadioGroupItem
                    value={item.value}
                    id={`type-${item.value}`}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={`type-${item.value}`}
                    className="flex flex-col items-center justify-between rounded-[var(--radius)] border-2 border-border bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary-600 peer-data-[state=checked]:bg-primary-50 dark:peer-data-[state=checked]:bg-primary-900/20 [&:has([data-state=checked])]:border-primary text-xs cursor-pointer text-center"
                  >
                    {item.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            <FormError errors={fieldErrors.type} />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-500">Reason *</label>
            <Textarea
              required
              rows={3}
              value={activeReason}
              onChange={(e) => { setReason(e.target.value); handleFieldChange({ reason: e.target.value }); }}
              className={`text-xs resize-none focus-visible:ring-primary-500 ${fieldErrors.reason ? "border-red-500" : ""}`}
              placeholder="Provide a brief reason for your leave request..."
            />
            <FormError errors={fieldErrors.reason} />
          </div>

          <Button
            type="submit"
            disabled={submitMutation.isPending || !activeStartDate || !activeEndDate || !activeReason}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold h-10"
          >
            {submitMutation.isPending ? <AppIcon name="loading" className=" animate-spin" /> : "Submit Request"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
