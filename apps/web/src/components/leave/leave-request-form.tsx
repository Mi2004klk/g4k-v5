"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    submitMutation.mutate({ start_date: startDate, end_date: endDate, type, reason });
  };

  return (
    <Card className="border-none shadow-sm">
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
          
          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-500">Leave Type *</label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {[
                { id: "casual", label: "Casual Leave (CL)" },
                { id: "sick", label: "Sick Leave (SL)" },
                { id: "earned", label: "Earned/Privileged Leave (EL)" },
                { id: "unpaid", label: "Leave Without Pay (LWP)" },
              ].map((item) => (
                <label
                  key={item.id}
                  className={`flex items-center p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                    type === item.id
                      ? "border-violet-600 bg-violet-50/50 dark:bg-violet-950/20 text-violet-700 dark:text-violet-300 font-semibold"
                      : "border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="leave_type"
                    value={item.id}
                    checked={type === item.id}
                    onChange={(e) => setType(e.target.value)}
                    className="mr-2 accent-violet-600"
                  />
                  {item.label}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-500">Reason *</label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-md border border-input bg-background resize-none focus:outline-none focus:ring-1 focus:ring-violet-500"
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
