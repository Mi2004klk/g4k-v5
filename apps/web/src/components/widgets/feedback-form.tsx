"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppIcon, Spinner,
} from "@g4k/ui/components";
import { apiFetch, isQueued } from "@/lib/api-client";
import { Card, CardHeader, CardTitle, CardContent } from "@g4k/ui/components";
import { Button } from "@g4k/ui/components";

export function FeedbackForm() {
  const [body, setBody] = useState("");

  const submitMutation = useMutation({
    mutationFn: async () => {
      return apiFetch("/feedback", {
        method: "POST",
        body: JSON.stringify({ body }),
      });
    },
    onSuccess: (data: any) => {
      if (isQueued(data)) return;
      toast.success("Feedback submitted to HR/Management.");
      setBody("");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to submit feedback.");
    },
  });

  return (
    <Card className=" bg-card dark:bg-neutral-900">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <AppIcon name="chat" />
          Submit Feedback / Grievance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <textarea
          placeholder="Share your concerns or feedback directly with HR & Management..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="w-full p-2.5 text-xs rounded-xl border border-input bg-background resize-none"
          rows={3}
        />
        {submitMutation.isError && (
          <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/20 p-2 rounded-[var(--radius)]">
            <AppIcon name="warning" size="xs" />
            <span>Failed to submit. Please try again.</span>
          </div>
        )}
        <Button
          onClick={() => submitMutation.mutate()}
          disabled={submitMutation.isPending || !body.trim()}
          className="w-full h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5"
        >
          {submitMutation.isPending ? <Spinner size="sm" /> : <AppIcon name="send" size="sm" />}
          Submit Privately
        </Button>
      </CardContent>
    </Card>
  );
}
