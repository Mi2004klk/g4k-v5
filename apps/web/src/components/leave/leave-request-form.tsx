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

export function LeaveRequestForm() {
  const queryClient = useQueryClient();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
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
      setStartDate("");
      setEndDate("");
      setReason("");
      setType("casual");
      queryClient.invalidateQueries({ queryKey: ["my-leave-history"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to submit leave request.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (new Date(endDate) < new Date(startDate)) {
      toast.error("End date must be on or after start date.");
      return;
    }

    // Task 245: Check client-side for overlaps across any cached my-leave-history queries
    const queries = queryClient.getQueriesData<any>({ queryKey: ["my-leave-history"] });
    const existingLeaves = queries.flatMap(([_, data]) => data?.data || []);
    const hasOverlap = existingLeaves.some((leave: any) => {
      if (leave.approval?.status !== "pending") return false;
      const existStart = new Date(leave.start_date);
      const existEnd = new Date(leave.end_date);
      const newStart = new Date(startDate);
      const newEnd = new Date(endDate);
      return newStart <= existEnd && newEnd >= existStart;
    });

    if (hasOverlap) {
      toast.error("You already have a pending leave request that overlaps with these dates.");
      return;
    }

    submitMutation.mutate({ start_date: startDate, end_date: endDate, type, reason });
  };

  return (
    <Card className="border-none shadow-sm h-full">
      <CardHeader>
        <CardTitle className="text-base font-bold">Request Time Off</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-500">Start Date *</label>
              <Input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-500">End Date *</label>
              <Input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9 text-xs"
              />
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
