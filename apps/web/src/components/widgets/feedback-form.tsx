"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { MessageSquarePlus, Send, Loader2, AlertTriangle } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
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
    onSuccess: () => {
      toast.success("Feedback submitted to HR/Management.");
      setBody("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to submit feedback.");
    },
  });

  return (
    <Card className="border-none shadow-sm bg-white dark:bg-neutral-900">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <MessageSquarePlus className="w-4 h-4 text-emerald-500" />
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
          <div className="flex items-center gap-2 text-[10px] text-rose-600 bg-rose-50 dark:bg-rose-950/20 p-2 rounded-lg">
            <AlertTriangle className="w-3 h-3" />
            <span>Failed to submit. Please try again.</span>
          </div>
        )}
        <Button
          onClick={() => submitMutation.mutate()}
          disabled={submitMutation.isPending || !body.trim()}
          className="w-full h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5"
        >
          {submitMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          Submit Privately
        </Button>
      </CardContent>
    </Card>
  );
}
