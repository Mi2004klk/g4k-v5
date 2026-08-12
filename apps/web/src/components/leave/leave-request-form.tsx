"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
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
import { Calendar as CalendarIcon } from "lucide-react";
import { queryKeys } from "@/lib/query-keys";

export function LeaveRequestForm() {
  const queryClient = useQueryClient();
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [type, setType] = useState("casual");
  const [reason, setReason] = useState("");

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
      queryClient.invalidateQueries({ queryKey: [queryKeys.myLeaveHistory()[0]] });
      queryClient.invalidateQueries({ queryKey: queryKeys.attendanceToday });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to submit leave request.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) return;

    if (endDate < startDate) {
      toast.error("End date must be on or after start date.");
      return;
    }

    const today = new Date();
    today.setHours(0,0,0,0);
    if (startDate <= today) {
      toast.error("Start date must be a future date.");
      return;
    }

    // Optimistic checking of overlapping dates based on cached data
    const queries = queryClient.getQueriesData<any>({ queryKey: [queryKeys.myLeaveHistory()[0]], exact: false });
    const existingLeaves = queries.flatMap(([_, data]) => data?.data || []);
    const hasOverlap = existingLeaves.some((leave: any) => {
      if (leave.approval?.status !== "pending") return false;
      const existStart = new Date(leave.start_date);
      const existEnd = new Date(leave.end_date);
      return startDate <= existEnd && endDate >= existStart;
    });

    if (hasOverlap) {
      toast.error("You already have a pending leave request that overlaps with these dates.");
      return;
    }

    submitMutation.mutate({ 
      start_date: format(startDate, "yyyy-MM-dd"), 
      end_date: format(endDate, "yyyy-MM-dd"), 
      type, 
      reason 
    });
  };

  const tomorrow = startOfTomorrow();

  return (
    <Card className="h-full border border-neutral-200 dark:border-neutral-800 shadow-e1 hover:shadow-e2 transition-shadow duration-150 rounded-xl overflow-hidden h-full">
      <CardHeader>
        <CardTitle className="text-base font-bold">Request Time Off</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-500">Start Date *</label>
              <Popover>
                <PopoverTrigger asChild>
                  <button type="button"
                    className="flex h-9 w-full items-center justify-between rounded-md border border-border bg-background px-3 text-xs">
                    {startDate ? format(startDate, "dd-MM-yyyy") : <span className="text-muted tracking-wide uppercase">DD-MM-YYYY</span>}
                    <CalendarIcon className="h-4 w-4 text-muted" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={startDate} onSelect={setStartDate}
                    disabled={{ before: tomorrow }}
                    initialFocus />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-500">End Date *</label>
              <Popover>
                <PopoverTrigger asChild>
                  <button type="button"
                    className="flex h-9 w-full items-center justify-between rounded-md border border-border bg-background px-3 text-xs">
                    {endDate ? format(endDate, "dd-MM-yyyy") : <span className="text-muted tracking-wide uppercase">DD-MM-YYYY</span>}
                    <CalendarIcon className="h-4 w-4 text-muted" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={endDate} onSelect={setEndDate}
                    disabled={{ before: startDate ?? tomorrow }}
                    initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-500">Leave Type *</label>
            <RadioGroup value={type} onValueChange={setType} className="grid grid-cols-2 gap-2 mt-1">
              {[
                { id: "casual", label: "Casual Leave (CL)" },
                { id: "sick", label: "Sick Leave (SL)" },
                { id: "earned", label: "Earned/Privileged Leave (EL)" },
                { id: "unpaid", label: "Leave Without Pay (LWP)" },
              ].map((item) => (
                <div key={item.id}>
                  <RadioGroupItem
                    value={item.id}
                    id={`type-${item.id}`}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={`type-${item.id}`}
                    className="flex flex-col items-center justify-between rounded-md border-2 border-border bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-violet-600 peer-data-[state=checked]:bg-violet-50 dark:peer-data-[state=checked]:bg-violet-900/20 [&:has([data-state=checked])]:border-primary text-xs cursor-pointer text-center"
                  >
                    {item.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-500">Reason *</label>
            <Textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="text-xs resize-none focus-visible:ring-violet-500"
              placeholder="Provide a brief reason for your leave request..."
            />
          </div>

          <Button
            type="submit"
            disabled={submitMutation.isPending || !startDate || !endDate || !reason}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold h-10"
          >
            {submitMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Request"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
